alter table public.bens_patrimoniais add column versao bigint not null default 1 check (versao > 0);
grant select (versao) on public.bens_patrimoniais to authenticated;

create table private.bens_cadastros (
  bem_id uuid primary key references public.bens_patrimoniais(id) on delete cascade,
  resultado jsonb not null
);
create table private.bens_tentativas (
  tentativa uuid primary key,
  bem_id uuid not null references public.bens_patrimoniais(id) on delete cascade,
  autor_id uuid not null references public.perfis(id),
  acao text not null check (acao in ('editar', 'arquivar')),
  resultado jsonb not null
);
create table private.bens_alteracoes (
  id uuid primary key default gen_random_uuid(),
  bem_id uuid not null references public.bens_patrimoniais(id) on delete cascade,
  autor_id uuid not null references public.perfis(id),
  tentativa uuid not null unique references private.bens_tentativas(tentativa),
  ocorrido_em timestamptz not null default clock_timestamp(),
  antes jsonb not null,
  depois jsonb not null
);
alter table private.bens_cadastros enable row level security;
alter table private.bens_tentativas enable row level security;
alter table private.bens_alteracoes enable row level security;
revoke all on private.bens_cadastros, private.bens_tentativas, private.bens_alteracoes from public, anon, authenticated, service_role;

-- Snapshot existing registrations before any edit/archive can be made.
insert into private.bens_cadastros(bem_id, resultado)
select b.id, to_jsonb(b) - array['numero','autor_id','tentativa_id','criado_em','versao'] from public.bens_patrimoniais b;
create function private.preservar_confirmacao_bem()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into private.bens_cadastros(bem_id, resultado)
  values (new.id, pg_catalog.to_jsonb(new) - array['numero','autor_id','tentativa_id','criado_em','versao']);
  return new;
end;
$$;
revoke all on function private.preservar_confirmacao_bem() from public, anon, authenticated, service_role;
create trigger bens_confirmacao_original after insert on public.bens_patrimoniais
for each row execute function private.preservar_confirmacao_bem();

create or replace function private.cadastrar_bem(dados jsonb, tentativa uuid, identidade uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  bem public.bens_patrimoniais;
  repetida boolean := false;
  texto_espacos text := U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF';
begin
  if auth.uid() is null or identidade is distinct from auth.uid() or tentativa is null then
    raise exception 'Identidade inválida' using errcode = '42501';
  end if;
  -- Same lock/order as account deletion: an excluded manager cannot register.
  -- ponytail: serialize with account deletion; use ordered row locks if throughput matters.
  perform pg_catalog.pg_advisory_xact_lock(40004);
  if not exists (select 1 from public.perfis where id = auth.uid() and papel = 'Gestor'
    and excluido_em is null and not provisionamento_pendente) then
    raise exception 'Gestor não autorizado' using errcode = '42501';
  end if;
  select * into bem from public.bens_patrimoniais where tentativa_id = tentativa;
  if found then
    if bem.autor_id <> auth.uid() then
      raise exception 'Tentativa pertence a outra identidade' using errcode = '42501';
    end if;
    repetida := true;
  else
    if pg_catalog.jsonb_typeof(dados) is distinct from 'object' then
      raise exception 'Dados inválidos' using errcode = '22023';
    end if;
    if exists (select 1 from pg_catalog.jsonb_each(dados) as e
      where e.key <> all(array['descricao','localizacao','estado_conservacao','marca','modelo','data_aquisicao','garantia_ate'])
      or pg_catalog.jsonb_typeof(e.value) not in ('string', 'null')) then
      raise exception 'Campos inválidos' using errcode = '22023';
    end if;
    select pg_catalog.jsonb_object_agg(e.key, nullif(pg_catalog.btrim(e.value #>> '{}', texto_espacos), ''))
      into dados from pg_catalog.jsonb_each(dados) as e;
    if exists (select 1 from pg_catalog.jsonb_each_text(dados) as e
      where e.key in ('data_aquisicao', 'garantia_ate') and e.value is not null
        and (e.value !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' or e.value < '0001-01-01')) then
      raise exception 'Data inválida' using errcode = '22023';
    end if;
    insert into public.bens_patrimoniais(autor_id, tentativa_id, descricao, localizacao,
      estado_conservacao, marca, modelo, data_aquisicao, garantia_ate)
    values (auth.uid(), tentativa, dados->>'descricao', dados->>'localizacao', dados->>'estado_conservacao',
      dados->>'marca', dados->>'modelo', (dados->>'data_aquisicao')::date, (dados->>'garantia_ate')::date)
    returning * into bem;
  end if;
  return (select resultado from private.bens_cadastros where bem_id = bem.id)
    || pg_catalog.jsonb_build_object('repetida', repetida);
end;
$$;

-- The private definer is required to mutate protected rows and append an audit
-- atomically without granting users direct UPDATE or audit forgery privileges.
create function private.alterar_bem(alvo uuid, versao_esperada bigint, acao text, dados jsonb, tentativa uuid, identidade uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  bem public.bens_patrimoniais;
  anterior jsonb;
  atual jsonb;
  salvo private.bens_tentativas;
  resultado jsonb;
  texto_espacos text := U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF';
begin
  if auth.uid() is null or identidade is distinct from auth.uid() then
    raise exception 'Identidade inválida' using errcode = '42501';
  end if;
  -- ponytail: serialize with account deletion and registration; per-row ordered
  -- locks can replace this shared lock if inventory write throughput matters.
  perform pg_catalog.pg_advisory_xact_lock(40004);
  if not exists (select 1 from public.perfis where id = auth.uid() and papel = 'Gestor'
    and excluido_em is null and not provisionamento_pendente) then
    raise exception 'Gestor não autorizado' using errcode = '42501';
  end if;
  if tentativa is null or alvo is null or versao_esperada is null or versao_esperada < 1
    or acao is null or acao not in ('editar', 'arquivar') then
    raise exception 'Tentativa inválida' using errcode = '22023';
  end if;
  select * into salvo from private.bens_tentativas t where t.tentativa = alterar_bem.tentativa;
  if found then
    if salvo.autor_id <> auth.uid() then
      raise exception 'Tentativa pertence a outra identidade' using errcode = '42501';
    end if;
    if salvo.bem_id <> alvo or salvo.acao <> acao then
      raise exception 'Tentativa não corresponde à operação' using errcode = '22023';
    end if;
    return salvo.resultado || pg_catalog.jsonb_build_object('repetida', true);
  end if;
  select * into bem from public.bens_patrimoniais where id = alvo for update;
  if not found then return pg_catalog.jsonb_build_object('status', 'nao_encontrado'); end if;
  if not bem.ativo then return pg_catalog.jsonb_build_object('status', 'ja_arquivado'); end if;
  anterior := pg_catalog.to_jsonb(bem) - array['numero','autor_id','tentativa_id','criado_em'];
  if bem.versao <> versao_esperada then
    return pg_catalog.jsonb_build_object('status', 'conflito', 'bem', anterior - 'ativo');
  end if;
  if acao = 'editar' then
    if pg_catalog.jsonb_typeof(dados) is distinct from 'object' or
      exists (select 1 from pg_catalog.jsonb_each(dados) e
        where e.key <> all(array['descricao','localizacao','estado_conservacao','marca','modelo','data_aquisicao','garantia_ate'])
        or pg_catalog.jsonb_typeof(e.value) not in ('string', 'null')) then
      raise exception 'Dados inválidos' using errcode = '22023';
    end if;
    select pg_catalog.jsonb_object_agg(e.key, nullif(pg_catalog.btrim(e.value #>> '{}', texto_espacos), ''))
      into dados from pg_catalog.jsonb_each(dados) e;
    if exists (select 1 from pg_catalog.jsonb_each_text(dados) e
      where e.key in ('data_aquisicao','garantia_ate') and e.value is not null
      and (e.value !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' or e.value < '0001-01-01')) then
      raise exception 'Data inválida' using errcode = '22023';
    end if;
    -- Assigning through the typed row and table constraints validates dates,
    -- lengths, required fields and conservation exactly as registration does.
    bem.descricao := dados->>'descricao';
    bem.localizacao := dados->>'localizacao';
    bem.estado_conservacao := dados->>'estado_conservacao';
    bem.marca := dados->>'marca';
    bem.modelo := dados->>'modelo';
    bem.data_aquisicao := (dados->>'data_aquisicao')::date;
    bem.garantia_ate := (dados->>'garantia_ate')::date;
  else
    if dados is not null and dados <> 'null'::jsonb then
      raise exception 'Arquivamento não aceita edição' using errcode = '22023';
    end if;
    bem.ativo := false;
  end if;
  atual := pg_catalog.to_jsonb(bem) - array['numero','autor_id','tentativa_id','criado_em'];
  if atual = anterior then
    resultado := pg_catalog.jsonb_build_object('status','sem_alteracoes','bem',atual - 'ativo','repetida',false);
  else
    update public.bens_patrimoniais b set descricao = bem.descricao, localizacao = bem.localizacao,
      estado_conservacao = bem.estado_conservacao, marca = bem.marca, modelo = bem.modelo,
      data_aquisicao = bem.data_aquisicao, garantia_ate = bem.garantia_ate, ativo = bem.ativo,
      versao = b.versao + 1 where b.id = alvo returning * into bem;
    atual := pg_catalog.to_jsonb(bem) - array['numero','autor_id','tentativa_id','criado_em'];
    resultado := pg_catalog.jsonb_build_object('status',case when acao = 'editar' then 'salvo' else 'arquivado' end,
      'bem',atual - 'ativo','repetida',false);
  end if;
  insert into private.bens_tentativas(tentativa,bem_id,autor_id,acao,resultado)
    values(tentativa,alvo,auth.uid(),acao,resultado);
  if atual <> anterior then
    insert into private.bens_alteracoes(bem_id,autor_id,tentativa,antes,depois)
      values(alvo,auth.uid(),tentativa,anterior,atual);
  end if;
  return resultado;
end;
$$;
revoke all on function private.alterar_bem(uuid,bigint,text,jsonb,uuid,uuid) from public, anon, authenticated, service_role;
grant execute on function private.alterar_bem(uuid,bigint,text,jsonb,uuid,uuid) to authenticated;
create function public.us027_alterar_bem(alvo uuid, versao_esperada bigint, acao text, dados jsonb, tentativa uuid, identidade uuid)
returns jsonb language sql security invoker set search_path = '' as $$
  select private.alterar_bem(alvo, versao_esperada, acao, dados, tentativa, identidade);
$$;
revoke all on function public.us027_alterar_bem(uuid,bigint,text,jsonb,uuid,uuid) from public, anon, service_role;
grant execute on function public.us027_alterar_bem(uuid,bigint,text,jsonb,uuid,uuid) to authenticated;
