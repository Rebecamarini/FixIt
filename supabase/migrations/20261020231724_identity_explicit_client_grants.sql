-- BT-003: replace project-dependent default grants with the identity contract.
revoke all on public.perfis, public.setores from anon, authenticated;
grant select on public.setores to anon, authenticated;
grant select on public.perfis to authenticated;
