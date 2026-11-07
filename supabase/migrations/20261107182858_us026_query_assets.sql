-- Column grants preserve the confidentiality of registration attempts and authors.
grant select (id, codigo, descricao, localizacao, estado_conservacao, marca, modelo,
  data_aquisicao, garantia_ate, numero, criado_em) on public.bens_patrimoniais to authenticated;
create policy bens_ativos_consulta on public.bens_patrimoniais for select to authenticated
using (ativo and exists (
  select 1 from public.perfis p where p.id = (select auth.uid())
    and p.papel in ('Gestor', 'Manutentor') and p.excluido_em is null and not p.provisionamento_pendente
));

-- Invoker keeps column privileges and RLS effective, including direct API calls.
create or replace function public.us026_listar_bens(busca text default '', pagina bigint default 1)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare
  total bigint;
  atual bigint;
  itens jsonb;
begin
  if auth.uid() is null or not exists (
    select 1 from public.perfis p where p.id = auth.uid() and p.papel in ('Gestor', 'Manutentor')
      and p.excluido_em is null and not p.provisionamento_pendente
  ) then
    raise exception 'Consulta não autorizada' using errcode = '42501';
  end if;
  busca := pg_catalog.btrim(coalesce(busca, ''), U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF');
  -- strpos treats %, _, * and backslash as literal text rather than patterns.
  select count(*) into total from public.bens_patrimoniais b
    where pg_catalog.strpos(pg_catalog.lower(b.codigo), pg_catalog.lower(coalesce(busca, ''))) > 0;
  atual := least(greatest(coalesce(pagina, 1), 1), greatest(1, (total + 9) / 10));
  select coalesce(pg_catalog.jsonb_agg(pg_catalog.to_jsonb(resumo)), '[]'::jsonb) into itens from (
    select b.id, b.codigo, b.descricao, b.localizacao, b.estado_conservacao
    from public.bens_patrimoniais b
    where pg_catalog.strpos(pg_catalog.lower(b.codigo), pg_catalog.lower(coalesce(busca, ''))) > 0
    order by b.criado_em desc, b.numero desc limit 10 offset (atual - 1) * 10
  ) resumo;
  return pg_catalog.jsonb_build_object('itens', itens, 'total', total, 'pagina', atual);
end;
$$;
revoke all on function public.us026_listar_bens(text, bigint) from public, anon, service_role;
grant execute on function public.us026_listar_bens(text, bigint) to authenticated;
create index bens_ativos_ordenacao on public.bens_patrimoniais (criado_em desc, numero desc) where ativo;
