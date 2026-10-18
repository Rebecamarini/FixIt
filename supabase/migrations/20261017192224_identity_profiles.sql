-- BT-003: Auth owns credentials; profiles own authorization.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.setores (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique check (nome !~ '^[[:space:]]*$')
);
alter table public.setores enable row level security;
grant select on public.setores to anon, authenticated;
grant all on public.setores to service_role;
create policy setores_leitura on public.setores for select to anon, authenticated using (true);

create table public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null check (nome !~ '^[[:space:]]*$'),
  matricula text not null check (matricula <> '' and matricula !~ '^[[:space:]]|[[:space:]]$'),
  setor_id uuid not null references public.setores(id),
  papel text not null default 'Cliente' check (papel in ('Cliente', 'Manutentor', 'Gestor'))
);
create unique index perfis_matricula_unica on public.perfis (lower(matricula));
create index perfis_setor_id on public.perfis(setor_id);
alter table public.perfis enable row level security;
grant select on public.perfis to authenticated;
grant all on public.perfis to service_role;
create policy perfil_proprio on public.perfis for select to authenticated using (id = (select auth.uid()));

create function private.criar_perfil() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.email is null or btrim(new.email) = '' then
    raise exception 'Email obrigatório';
  end if;
  insert into public.perfis (id, nome, matricula, setor_id, papel)
  values (new.id, regexp_replace(new.raw_user_meta_data->>'nome', '^[[:space:]]+|[[:space:]]+$', '', 'g'),
    regexp_replace(new.raw_user_meta_data->>'matricula', '^[[:space:]]+|[[:space:]]+$', '', 'g'),
    (new.raw_user_meta_data->>'setor_id')::uuid, 'Cliente');
  return new;
end;
$$;
revoke all on function private.criar_perfil() from public, anon, authenticated;
create trigger criar_perfil after insert on auth.users for each row execute function private.criar_perfil();

-- Referências fictícias, estáveis e disponíveis antes do primeiro autocadastro.
insert into public.setores(id, nome) values
 ('10000000-0000-4000-8000-000000000001', 'Ensino (fictício)'),
 ('10000000-0000-4000-8000-000000000002', 'Administração (fictício)');
