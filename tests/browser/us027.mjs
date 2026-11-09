import assert from 'node:assert/strict';
import { localAdmin, uniqueSignup, createRoleUser, cookieJar } from '../support/identity.ts';
import { createRequestClient } from '../../src/server/identity.ts';
import { cadastrarBem } from '../../src/server/assets.ts';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const url = process.env.FIXIT_BROWSER_URL || 'http://127.0.0.1:3102';
assert.equal(new URL(url).hostname, '127.0.0.1');
const admin = localAdmin();
const users = [];
const assets = [];
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
try {
  for (const papel of ['Gestor', 'Manutentor']) {
    const signup = uniqueSignup();
    const created = await createRoleUser(admin, signup, papel);
    assert.ok(created.data.user); users.push({ id: created.data.user.id, signup, papel });
  }
  const client = createRequestClient(cookieJar());
  await client.auth.signInWithPassword({ email: users[0].signup.email, password: users[0].signup.password });
  const result = await cadastrarBem(client, { descricao: 'Bem UI US-027', localizacao: 'Sala original', estado_conservacao: 'Bom', marca: '', modelo: '', data_aquisicao: '', garantia_ate: '' }, crypto.randomUUID(), users[0].id);
  assert.ok(result.confirmation); const bem = result.confirmation; assets.push(bem.id);
  const context = await browser.newContext({ viewport: { width: 390, height: 900 } });
  const page = await context.newPage();
  await page.goto(url + '/conta/entrar');
  await page.locator('#email').fill(users[0].signup.email);
  await page.locator('#senha').fill(users[0].signup.password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.waitForURL(url + '/');
  const details = `${url}/patrimonios/${bem.id}?busca=${bem.codigo}&pagina=1`;
  await page.goto(details);
  await page.getByRole('link', { name: 'Editar', exact: true }).click({ timeout: 5000 });
  await page.getByRole('heading', { name: 'Editar bem patrimonial', exact: true }).waitFor();
  assert.equal(await page.locator('#localizacao').inputValue(), 'Sala original');
  await page.locator('#localizacao').fill('Sala editada');
  await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
  await page.getByRole('heading', { name: 'Detalhes do bem', exact: true }).waitFor();
  await page.getByText('Sala editada', { exact: true }).waitFor();
  await page.getByRole('link', { name: 'Arquivar', exact: true }).click();
  await page.getByRole('heading', { name: 'Arquivar bem patrimonial', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Arquivar bem', exact: true }).click();
  await page.getByRole('heading', { name: 'Consultar bens', exact: true }).waitFor();
  await page.getByText('Bem arquivado.', { exact: true }).waitFor();
  assert.ok(page.url().includes('busca=' + bem.codigo));
  await page.goto(details);
  await page.getByRole('heading', { name: 'Bem não encontrado', exact: true }).waitFor();
  assert.equal(await page.getByRole('link', { name: 'Editar', exact: true }).count(), 0);
  console.log('US-027 browser smoke passed');
} finally {
  await browser.close();
  if (assets.length) {
    await admin.from('bens_patrimoniais').delete().in('id', assets);
  }
  for (const user of users) await admin.auth.admin.deleteUser(user.id);
}
