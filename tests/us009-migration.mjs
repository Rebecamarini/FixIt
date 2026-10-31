import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';

// Run only against the disposable local container, after resetting to US-004.
// The transaction rolls back both fixtures and DDL, even if an assertion fails.
const author = randomUUID();
const request = randomUUID();
const migration = readFileSync(new URL('../supabase/migrations/20261028205115_us009_send_requests.sql', import.meta.url), 'utf8');
const sql = `
begin;
insert into public.perfis (id, nome, papel) values ('${author}', 'Legado fictício', 'Cliente');
select set_config('request.jwt.claim.sub', '${author}', true);
insert into public.solicitacoes (id, autor_id, categoria_id, local, assunto, descricao)
values ('${request}', '${author}', '20000000-0000-4000-8000-000000000001',
  'Sala antiga', 'Pedido anterior à US-009', 'Preservar dados e evento inicial.');
create temporary table legacy_request as
  select to_jsonb(s) as data from public.solicitacoes s where id = '${request}';
create temporary table legacy_history as
  select to_jsonb(h) as data from public.historico_solicitacoes h where solicitacao_id = '${request}';
do $$ begin
  if (select count(*) from legacy_request) <> 1 or (select count(*) from legacy_history) <> 1 then
    raise exception 'Legacy fixture must contain one request and its original event';
  end if;
end $$;
${migration}
do $$ begin
  if (select solicitante_id from public.solicitacoes where id = '${request}') is distinct from '${author}'::uuid
    or (select tentativa_id from public.solicitacoes where id = '${request}') is not null
    or (select to_jsonb(s) - 'solicitante_id' - 'tentativa_id' from public.solicitacoes s where id = '${request}')
      is distinct from (select data from legacy_request) then
    raise exception 'Migration changed legacy request data or failed to backfill its owner';
  end if;
  if (select count(*) from public.historico_solicitacoes where solicitacao_id = '${request}') <> 1
    or (select to_jsonb(h) from public.historico_solicitacoes h where solicitacao_id = '${request}')
      is distinct from (select data from legacy_history) then
    raise exception 'Migration changed the original history event';
  end if;
end $$;
rollback;
`;
execFileSync('docker', ['exec', '-i', 'supabase_db_fixit', 'psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1'], {
  input: sql, stdio: ['pipe', 'inherit', 'inherit'],
});
