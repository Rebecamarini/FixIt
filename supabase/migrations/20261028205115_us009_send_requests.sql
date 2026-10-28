-- Preserve legacy ownership and history; only the submission boundary can insert.
alter table public.solicitacoes add column solicitante_id uuid references public.perfis(id),
  add column tentativa_id uuid;
update public.solicitacoes set solicitante_id = autor_id;
alter table public.solicitacoes alter column solicitante_id set not null;
create unique index solicitacoes_tentativa on public.solicitacoes(tentativa_id);
create index solicitacoes_solicitante_criacao on public.solicitacoes(solicitante_id, criado_em desc, id desc);
revoke insert on public.solicitacoes from authenticated;
revoke insert (categoria_id, local, assunto, descricao, motivo, pessoas_areas_afetadas,
  frequencia, tipo_utilizacao, riscos, patrimonios_afetados) on public.solicitacoes from authenticated;
drop policy solicitacoes_criar on public.solicitacoes;
drop policy solicitacoes_proprias on public.solicitacoes;
create policy solicitacoes_proprias on public.solicitacoes for select to authenticated
  using (solicitante_id = (select auth.uid()) and exists (
    select 1 from public.perfis where id = (select auth.uid()) and papel = 'Cliente'));

-- Private definer is necessary to insert protected rows and return confirmation for
-- all three roles without widening their consultation permissions.
create function private.enviar_solicitacao(dados jsonb, tentativa uuid, identidade uuid, solicitante uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  autor public.perfis;
  destinatario public.perfis;
  pedido public.solicitacoes;
  repetida boolean := false;
begin
  if auth.uid() is null or identidade is distinct from auth.uid() or tentativa is null then
    raise exception 'Identidade inválida' using errcode = '42501';
  end if;
  -- Same lock/order as account deletion: the winner determines active eligibility.
  -- ponytail: serialize submissions/deletions; use ordered row locks if throughput matters.
  perform pg_catalog.pg_advisory_xact_lock(40004);
  select * into autor from public.perfis
    where id = auth.uid() and excluido_em is null and not provisionamento_pendente;
  if not found then raise exception 'Sessão inválida' using errcode = '42501'; end if;
  select * into pedido from public.solicitacoes
    where tentativa_id = tentativa;
  if found and pedido.autor_id <> auth.uid() then
    raise exception 'Tentativa pertence a outra identidade' using errcode = '42501';
  end if;
  if found then
    repetida := true;
    select * into destinatario from public.perfis where id = pedido.solicitante_id;
  else
    if solicitante is null then solicitante := autor.id; end if;
    if solicitante <> autor.id and autor.papel <> 'Gestor' then
      raise exception 'Representação proibida' using errcode = '42501';
    end if;
    select * into destinatario from public.perfis
      where id = solicitante and excluido_em is null and not provisionamento_pendente;
    if not found then raise exception 'Solicitante indisponível' using errcode = 'P0002'; end if;
    if pg_catalog.jsonb_typeof(dados) is distinct from 'object' or exists (
      select 1 from pg_catalog.jsonb_each(dados) as e
      where e.key <> all(array['categoria_id','local','assunto','descricao','motivo',
        'pessoas_areas_afetadas','frequencia','tipo_utilizacao','riscos','patrimonios_afetados'])
        or pg_catalog.jsonb_typeof(e.value) not in ('string','null')
    ) then raise exception 'Dados inválidos' using errcode = '22023'; end if;
    if not exists (select 1 from public.categorias where id = (dados->>'categoria_id')::uuid) then
      raise exception 'Categoria indisponível' using errcode = 'P0003';
    end if;
    insert into public.solicitacoes(autor_id, solicitante_id, tentativa_id, categoria_id,
      local, assunto, descricao, motivo, pessoas_areas_afetadas, frequencia,
      tipo_utilizacao, riscos, patrimonios_afetados)
    values (autor.id, destinatario.id, tentativa, (dados->>'categoria_id')::uuid,
      dados->>'local', dados->>'assunto', dados->>'descricao', dados->>'motivo',
      dados->>'pessoas_areas_afetadas', dados->>'frequencia', dados->>'tipo_utilizacao',
      dados->>'riscos', dados->>'patrimonios_afetados')
    returning * into pedido;
  end if;
  return pg_catalog.jsonb_build_object('solicitacao', pg_catalog.to_jsonb(pedido),
    'ja_registrada', repetida, 'autor_nome', autor.nome, 'solicitante_nome', destinatario.nome);
end;
$$;
revoke all on function private.enviar_solicitacao(jsonb, uuid, uuid, uuid) from public, anon, authenticated, service_role;
grant usage on schema private to authenticated;
grant execute on function private.enviar_solicitacao(jsonb, uuid, uuid, uuid) to authenticated;
create function public.us009_enviar_solicitacao(dados jsonb, tentativa uuid, identidade uuid, solicitante uuid default null)
returns jsonb language sql security invoker set search_path = '' as $$
  select private.enviar_solicitacao(dados, tentativa, identidade, solicitante);
$$;
revoke all on function public.us009_enviar_solicitacao(jsonb, uuid, uuid, uuid) from public, anon, service_role;
grant execute on function public.us009_enviar_solicitacao(jsonb, uuid, uuid, uuid) to authenticated;
