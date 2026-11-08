import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { localAdmin, uniqueSignup, createRoleUser } from '../support/identity.ts';
import { createRequestClient } from '../../src/server/identity.ts';
import { cadastrarBem } from '../../src/server/assets.ts';
import { cookieJar } from '../support/identity.ts';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const url = process.env.FIXIT_BROWSER_URL || 'http://127.0.0.1:3102';
assert.equal(new URL(url).hostname, '127.0.0.1');
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
const admin = localAdmin();
const users = [];
const migration = readFileSync(new URL('../../supabase/migrations/20261107182858_us026_query_assets.sql', import.meta.url), 'utf8');
const restore = migration.slice(migration.indexOf('create or replace function'), migration.indexOf('revoke all on function'));
function sql(statement) {
  execFileSync('docker', ['exec', 'supabase_db_fixit', 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-c', statement], { stdio: 'pipe' });
}
try {
  for (const papel of ['Gestor', 'Manutentor', 'Cliente']) {
    const signup = uniqueSignup();
    const user = await createRoleUser(admin, signup, papel);
    users.push({ id: user.data.user.id, signup, papel });
  }
  const client = createRequestClient(cookieJar());
  await client.auth.signInWithPassword({ email: users[0].signup.email, password: users[0].signup.password });
  const fixtures = [];
  for (let i = 0; i < 12; i++) {
    const result = await cadastrarBem(client, { descricao: 'Bem de consulta ' + i, localizacao: 'Sala de testes', estado_conservacao: 'Péssimo', marca: '', modelo: '', data_aquisicao: '', garantia_ate: '' }, crypto.randomUUID(), users[0].id);
    assert.ok(result.confirmation); fixtures.push(result.confirmation);
  }
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  await page.goto(url + '/patrimonios');
  await page.getByRole('heading', { name: 'Sessão necessária' }).waitFor();
  for (const user of users) {
    const context = await browser.newContext({ viewport: { width: 390, height: 900 } });
    const p = await context.newPage();
    await p.goto(url + '/conta/entrar');
    await p.locator('#email').fill(user.signup.email);
    await p.locator('#senha').fill(user.signup.password);
    await p.getByRole('button', { name: 'Entrar', exact: true }).click();
    await p.waitForURL(url + '/');
    if (user.papel === 'Cliente') {
      assert.equal(await p.getByRole('link', { name: 'Consultar bens', exact: true }).count(), 0);
      await p.goto(url + '/patrimonios');
      await p.getByRole('heading', { name: 'Acesso restrito' }).waitFor();
      await context.close(); continue;
    }
    await p.getByRole('link', { name: 'Consultar bens', exact: true }).click();
    await p.getByRole('heading', { name: 'Consultar bens', exact: true }).waitFor();
    await p.getByRole('link', { name: 'Abrir detalhes', exact: true }).first().waitFor();
    assert.equal(await p.getByRole('link', { name: 'Abrir detalhes', exact: true }).count(), 10);
    await p.getByLabel('Pesquisar por código').fill('bem-');
    await p.getByRole('button', { name: 'Pesquisar', exact: true }).click();
    await p.getByRole('link', { name: 'Próxima', exact: true }).click();
    await p.waitForURL(/pagina=2/);
    const origin = p.url();
    assert.ok(origin.includes('pagina=2'));
    await p.getByRole('link', { name: 'Abrir detalhes', exact: true }).first().click();
    await p.getByRole('heading', { name: 'Detalhes do bem' }).waitFor();
    await p.getByText('Não informado', { exact: true }).first().waitFor();
    assert.equal(await p.getByRole('link', { name: /histórico/i }).count(), 0);
    await p.getByRole('link', { name: 'Voltar à lista', exact: true }).click();
    await p.waitForURL(origin);
    assert.equal(p.url(), origin);
    await p.reload();
    assert.equal(await p.getByLabel('Pesquisar por código').inputValue(), 'bem-');
    await p.getByLabel('Pesquisar por código').fill('%');
    await p.getByLabel('Pesquisar por código').press('Enter');
    await p.getByText('Nenhum bem encontrado', { exact: true }).waitFor();
    assert.ok(!p.url().includes('pagina=2'));
    if (user.papel === 'Gestor') {
      await p.goto(origin);
      sql("create or replace function public.us026_listar_bens(busca text default '', pagina bigint default 1) returns jsonb language plpgsql stable security invoker set search_path = '' as $$ begin raise exception 'Falha simulada de leitura'; end; $$");
      await p.reload();
      await p.getByRole('alert').waitFor();
      assert.equal(p.url(), origin);
      sql(restore);
      await p.getByRole('link', { name: 'Tentar novamente' }).click();
      await p.getByRole('link', { name: 'Abrir detalhes', exact: true }).first().waitFor();
      assert.equal(p.url(), origin);
    }
    assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await p.screenshot({ path: '/tmp/fixit-us026-' + user.papel + '.png', fullPage: true });
    await context.close();
  }
  console.log('PASS US026: sessão, papéis, busca, paginação, detalhes, volta, recarga, falha/recuperação e tela móvel');
} finally {
  sql(restore);
  await admin.from('bens_patrimoniais').delete().in('autor_id', users.map(u => u.id));
  for (const user of users) await admin.auth.admin.deleteUser(user.id);
  await browser.close();
}
