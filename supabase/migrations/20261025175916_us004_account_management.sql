-- US-004: fixed roles, active accounts, terminal logical deletion, and email reuse.
alter table public.perfis
  drop constraint perfis_matricula_check,
  alter column matricula drop not null,
  alter column setor_id drop not null,
  drop constraint perfis_id_fkey,
  add column excluido_em timestamptz,
  add column provisionamento_pendente boolean not null default false;
drop index if exists public.perfis_matricula_unica;

create index perfis_ativos_nome on public.perfis (lower(nome), id) where excluido_em is null;
create index perfis_ativos_papel on public.perfis (papel) where excluido_em is null;

create table public.exclusoes_contas (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references public.perfis(id),
  autor_id uuid not null references public.perfis(id),
  excluido_em timestamptz not null,
  constraint exclusoes_contas_conta_unica unique (conta_id)
);
alter table public.exclusoes_contas enable row level security;
create index exclusoes_contas_autor on public.exclusoes_contas(autor_id);
revoke all on public.exclusoes_contas from public, anon, authenticated, service_role;
grant select on public.exclusoes_contas to service_role;

create function private.rejeitar_alteracao_exclusao_conta() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'Registro de exclusão é imutável' using errcode = '42501';
end;
$$;
revoke all on function private.rejeitar_alteracao_exclusao_conta() from public, anon, authenticated, service_role;
create trigger exclusoes_contas_imutaveis before update or delete on public.exclusoes_contas
  for each row execute function private.rejeitar_alteracao_exclusao_conta();

create or replace function private.criar_perfil() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  espacos constant text := U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF';
begin
  if new.email is null or btrim(new.email) = '' then
    raise exception 'Email obrigatório';
  end if;
  if jsonb_typeof(new.raw_user_meta_data->'nome') is distinct from 'string' then
    raise exception 'Nome deve ser textual';
  end if;
  -- Only trusted provisioning can reserve a UUID and its fixed role before Auth.
  if exists (select 1 from public.perfis where id = new.id and provisionamento_pendente) then
    return new;
  end if;
  insert into public.perfis (id, nome, papel)
  values (new.id, btrim(new.raw_user_meta_data->>'nome', espacos), 'Cliente');
  return new;
end;
$$;

drop policy perfil_proprio on public.perfis;
create policy perfis_ativos_leitura on public.perfis for select to authenticated
  using (excluido_em is null and not provisionamento_pendente and id = (select auth.uid()));
drop policy perfil_proprio_edicao on public.perfis;
revoke update on public.perfis from authenticated;
revoke update (nome, matricula, setor_id) on public.perfis from authenticated;
grant update (nome) on public.perfis to authenticated;
create policy perfis_ativos_edicao on public.perfis for update to authenticated
  using (id = (select auth.uid()) and excluido_em is null and not provisionamento_pendente)
  with check (id = (select auth.uid()) and excluido_em is null and not provisionamento_pendente);

create or replace function public.us004_excluir_conta(alvo uuid, autor uuid)
returns text
language plpgsql security definer set search_path = '' as $$
declare
  alvo_papel text;
  autor_papel text;
  alvo_excluido timestamptz;
begin
  -- Serialize account removals so authorization and the last-Manager invariant
  -- are checked against the state produced by the previous operation.
  perform pg_advisory_xact_lock(40004);
  select papel, excluido_em into alvo_papel, alvo_excluido
    from public.perfis where id = alvo for update;
  select papel into autor_papel from public.perfis
    where id = autor and excluido_em is null for update;
  if autor_papel is distinct from 'Gestor' then
    raise exception 'Não autorizado' using errcode = '42501';
  end if;
  if alvo = autor then raise exception 'Não é possível excluir a própria conta' using errcode = '22023'; end if;
  if alvo_papel is null then raise exception 'Conta não encontrada' using errcode = 'P0002'; end if;
  if alvo_excluido is not null then return 'ja_excluida'; end if;
  if alvo_papel = 'Gestor' and (select count(*) from public.perfis
      where papel = 'Gestor' and excluido_em is null) <= 1 then
    raise exception 'O sistema precisa manter ao menos um Gestor ativo' using errcode = '23514';
  end if;

  update public.perfis set excluido_em = pg_catalog.clock_timestamp() where id = alvo;
  insert into public.exclusoes_contas (conta_id, autor_id, excluido_em)
    select id, autor, excluido_em from public.perfis where id = alvo;
  return 'excluida';
end;
$$;
revoke all on function public.us004_excluir_conta(uuid, uuid) from public, anon, authenticated;
grant execute on function public.us004_excluir_conta(uuid, uuid) to service_role;

create function private.proteger_papel_fixo() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.papel is distinct from old.papel then
    raise exception 'O papel da conta é fixo' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function private.proteger_papel_fixo() from public, anon, authenticated, service_role;
create trigger perfis_papel_fixo before update of papel on public.perfis
  for each row execute function private.proteger_papel_fixo();

create or replace function public.us004_preparar_criacao(alvo uuid, autor uuid, nome_inicial text, papel_inicial text)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(40004);
  if not exists (select 1 from public.perfis where id = autor and papel = 'Gestor' and excluido_em is null and not provisionamento_pendente) then
    raise exception 'Não autorizado' using errcode = '42501';
  end if;
  if papel_inicial is null or papel_inicial not in ('Manutentor', 'Gestor') then
    raise exception 'Papel inválido' using errcode = '22023';
  end if;
  insert into public.perfis(id, nome, papel, provisionamento_pendente)
    values (alvo, nome_inicial, papel_inicial, true);
end;
$$;
revoke all on function public.us004_preparar_criacao(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.us004_preparar_criacao(uuid, uuid, text, text) to service_role;

create or replace function public.us004_finalizar_criacao(alvo uuid, autor uuid)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(40004);
  if not exists (select 1 from public.perfis where id = autor and papel = 'Gestor' and excluido_em is null and not provisionamento_pendente) then
    raise exception 'Não autorizado' using errcode = '42501';
  end if;
  if exists (select 1 from public.perfis p join auth.users u on u.id = p.id
      where p.id = alvo and p.papel in ('Manutentor', 'Gestor') and p.excluido_em is null and not p.provisionamento_pendente) then
    return;
  end if;
  update public.perfis set provisionamento_pendente = false
    where id = alvo and excluido_em is null and provisionamento_pendente and papel in ('Manutentor', 'Gestor')
      and exists (select 1 from auth.users where id = alvo);
  if not found then raise exception 'Conta não encontrada' using errcode = 'P0002'; end if;
end;
$$;
revoke all on function public.us004_finalizar_criacao(uuid, uuid) from public, anon, authenticated;
grant execute on function public.us004_finalizar_criacao(uuid, uuid) to service_role;

create or replace function public.us004_listar_contas(autor uuid, busca text, filtro_papel text, pagina integer)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare resultado jsonb;
begin
  if not exists (select 1 from public.perfis where id = autor and papel = 'Gestor' and excluido_em is null) then
    raise exception 'Não autorizado' using errcode = '42501';
  end if;
  with encontrados as materialized (
    select p.id, p.nome, u.email, p.papel
    from public.perfis p join auth.users u on u.id = p.id
    where p.excluido_em is null and not p.provisionamento_pendente and u.deleted_at is null
      and (filtro_papel = '' or p.papel = filtro_papel)
      and (position(lower(busca) in lower(p.nome)) > 0 or position(lower(busca) in lower(u.email)) > 0)
  ), informacao as (
    select count(*) as total,
      least(greatest(pagina, 1), greatest(1, ceil(count(*) / 20.0)::integer)) as pagina
    from encontrados
  ), selecionados as (
    select * from encontrados order by nome collate "pt-BR-x-icu", id
      limit 20 offset (select (informacao.pagina - 1) * 20 from informacao)
  )
  select jsonb_build_object('items', coalesce((select jsonb_agg(to_jsonb(s) order by s.nome collate "pt-BR-x-icu", s.id) from selecionados s), '[]'::jsonb),
    'total', total, 'page', informacao.pagina, 'forbidden', false)
    into resultado from informacao;
  return resultado;
end;
$$;
revoke all on function public.us004_listar_contas(uuid, text, text, integer) from public, anon, authenticated;
grant execute on function public.us004_listar_contas(uuid, text, text, integer) to service_role;
