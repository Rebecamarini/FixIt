-- US-003/T01: column privileges and RLS protect identity and authorization.
grant update (nome, matricula, setor_id) on public.perfis to authenticated;
create policy perfil_proprio_edicao on public.perfis for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
