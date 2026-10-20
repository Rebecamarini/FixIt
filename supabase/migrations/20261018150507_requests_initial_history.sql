-- BT-004: only the Cliente creation/read seam; administrative transitions come later.
create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique check (nome !~ U&'^[[:space:]\FEFF]*$')
);
alter table public.categorias enable row level security;
revoke all on public.categorias from anon, authenticated;
grant select on public.categorias to anon, authenticated;
grant all on public.categorias to service_role;
create policy categorias_leitura on public.categorias for select to anon, authenticated using (true);

create table public.solicitacoes (
  id uuid primary key default gen_random_uuid(),
  autor_id uuid not null default auth.uid() references public.perfis(id),
  categoria_id uuid not null references public.categorias(id),
  local text not null check (local !~ U&'^[[:space:]\FEFF]*$'),
  assunto text not null check (assunto !~ U&'^[[:space:]\FEFF]*$'),
  descricao text not null check (descricao !~ U&'^[[:space:]\FEFF]*$'),
  motivo text,
  pessoas_areas_afetadas text,
  frequencia text,
  tipo_utilizacao text,
  riscos text,
  patrimonios_afetados text,
  criado_em timestamptz not null default now(),
  estado text not null default 'Pendente' check (estado = 'Pendente')
);
create index solicitacoes_autor_criacao on public.solicitacoes(autor_id, criado_em desc, id desc);
create index solicitacoes_categoria_id on public.solicitacoes(categoria_id);
alter table public.solicitacoes enable row level security;
revoke all on public.solicitacoes from anon, authenticated;
grant select on public.solicitacoes to authenticated;
grant insert (categoria_id, local, assunto, descricao, motivo, pessoas_areas_afetadas,
  frequencia, tipo_utilizacao, riscos, patrimonios_afetados) on public.solicitacoes to authenticated;
grant all on public.solicitacoes to service_role;
create policy solicitacoes_proprias on public.solicitacoes for select to authenticated
  using (autor_id = (select auth.uid()) and exists (
    select 1 from public.perfis where id = (select auth.uid()) and papel = 'Cliente'));
create policy solicitacoes_criar on public.solicitacoes for insert to authenticated
  with check (autor_id = (select auth.uid()) and exists (
    select 1 from public.perfis where id = (select auth.uid()) and papel = 'Cliente'));

create table public.historico_solicitacoes (
  id uuid primary key default gen_random_uuid(),
  solicitacao_id uuid not null references public.solicitacoes(id) on delete cascade,
  autor_id uuid not null references public.perfis(id),
  criado_em timestamptz not null default now(),
  descricao text not null check (descricao !~ U&'^[[:space:]\FEFF]*$'),
  estado_anterior text,
  estado_novo text not null check (estado_novo = 'Pendente')
);
create index historico_solicitacao_criacao on public.historico_solicitacoes(solicitacao_id, criado_em, id);
create index historico_autor_id on public.historico_solicitacoes(autor_id);
alter table public.historico_solicitacoes enable row level security;
revoke all on public.historico_solicitacoes from anon, authenticated;
grant select on public.historico_solicitacoes to authenticated;
grant all on public.historico_solicitacoes to service_role;
create policy historico_proprio on public.historico_solicitacoes for select to authenticated
  using (exists (select 1 from public.solicitacoes where id = solicitacao_id));

-- The trigger alone may insert protected history, in the same transaction as its parent.
-- SECURITY DEFINER is required because API clients have no history INSERT grant.
create function private.registrar_criacao_solicitacao() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or new.autor_id <> auth.uid() then
    raise exception 'Autoria inválida' using errcode = '42501';
  end if;
  insert into public.historico_solicitacoes
    (solicitacao_id, autor_id, criado_em, descricao, estado_anterior, estado_novo)
  values (new.id, new.autor_id, new.criado_em, 'Solicitação criada.', null, new.estado);
  return new;
end;
$$;
revoke all on function private.registrar_criacao_solicitacao() from public, anon, authenticated, service_role;
create trigger registrar_criacao_solicitacao after insert on public.solicitacoes
  for each row execute function private.registrar_criacao_solicitacao();

insert into public.categorias(id, nome) values
 ('20000000-0000-4000-8000-000000000001', 'Elétrica (fictícia)'),
 ('20000000-0000-4000-8000-000000000002', 'Hidráulica (fictícia)');
