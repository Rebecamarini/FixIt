create sequence private.bens_codigo_seq;

create table public.bens_patrimoniais (
  id uuid primary key default gen_random_uuid(),
  numero bigint not null default nextval('private.bens_codigo_seq') unique check (numero > 0),
  codigo text generated always as ('BEM-' || lpad(numero::text, greatest(6, length(numero::text)), '0')) stored unique,
  autor_id uuid not null references public.perfis(id),
  tentativa_id uuid not null unique,
  descricao text not null check (char_length(descricao) between 1 and 500),
  localizacao text not null check (char_length(localizacao) between 1 and 200),
  estado_conservacao text not null check (estado_conservacao in ('Novo', 'Bom', 'Regular', 'Ruim', 'Péssimo')),
  marca text check (char_length(marca) between 1 and 100),
  modelo text check (char_length(modelo) between 1 and 100),
  data_aquisicao date,
  garantia_ate date,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  check (data_aquisicao is null or data_aquisicao <= (now() at time zone 'America/Sao_Paulo')::date),
  check (data_aquisicao is null or garantia_ate is null or garantia_ate >= data_aquisicao)
);
alter table public.bens_patrimoniais enable row level security;
revoke all on public.bens_patrimoniais from public, anon, authenticated;
grant all on public.bens_patrimoniais to service_role;
revoke all on sequence private.bens_codigo_seq from public, anon, authenticated;

-- Private definer is needed to write protected rows and return only the own
-- operation's confirmation, without granting inventory consultation (US-026).
create function private.cadastrar_bem(dados jsonb, tentativa uuid, identidade uuid)
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
  return (pg_catalog.to_jsonb(bem) - array['numero','autor_id','tentativa_id','criado_em'])
    || pg_catalog.jsonb_build_object('repetida', repetida);
end;
$$;
revoke all on function private.cadastrar_bem(jsonb, uuid, uuid) from public, anon, authenticated, service_role;
grant usage on schema private to authenticated;
grant execute on function private.cadastrar_bem(jsonb, uuid, uuid) to authenticated;
create function public.us025_cadastrar_bem(dados jsonb, tentativa uuid, identidade uuid)
returns jsonb language sql security invoker set search_path = '' as $$
  select private.cadastrar_bem(dados, tentativa, identidade);
$$;
revoke all on function public.us025_cadastrar_bem(jsonb, uuid, uuid) from public, anon, service_role;
grant execute on function public.us025_cadastrar_bem(jsonb, uuid, uuid) to authenticated;
