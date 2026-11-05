import assert from 'node:assert/strict';
import { localAdmin, uniqueSignup, createRoleUser } from '../support/identity.ts';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const url = process.env.FIXIT_BROWSER_URL || 'http://127.0.0.1:3102';
assert.equal(new URL(url).hostname, '127.0.0.1');
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
const admin = localAdmin();
const signup = uniqueSignup();
const user = await createRoleUser(admin, signup, 'Gestor');
const author = user.data.user.id;
async function fill(page) {
  await page.getByLabel('Descrição (obrigatório)').fill(' Mesa de testes US025 ');
  await page.getByLabel('Localização (obrigatório)').fill(' Sala 203 ');
  await page.getByLabel('Estado de conservação (obrigatório)').selectOption('Péssimo');
}
async function saved() {
  const result = await admin.from('bens_patrimoniais').select('id,codigo,descricao').eq('autor_id', author);
  assert.equal(result.error, null);
  return result.data;
}
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto(url + '/patrimonios/novo');
  await page.waitForURL(url + '/conta/entrar', { timeout: 15000 });
  console.log('PASS visitante não abre cadastro de bem');
  await page.locator('#email').fill(signup.email);
  await page.locator('#senha').fill(signup.password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.waitForURL(url + '/');
  await page.getByRole('link', { name: 'Cadastrar bem', exact: true }).click({ timeout: 10000 });
  assert.equal(await page.getByLabel('Estado de conservação (obrigatório)').inputValue(), '');
  await page.getByRole('button', { name: 'Salvar bem', exact: true }).click();
  await page.locator('#descricao[aria-invalid="true"]').waitFor();
  await page.waitForFunction(() => document.activeElement?.id === 'descricao');
  await page.locator('#descricao').pressSequentially('Mesa', { delay: 50 });
  assert.equal(await page.locator('#descricao').inputValue(), 'Mesa', 'corrigir erro não deve interromper a digitação');
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'descricao');
  await fill(page);
  await page.getByRole('button', { name: 'Salvar bem', exact: true }).click();
  await page.getByRole('heading', { name: 'Bem cadastrado', exact: true }).waitFor();
  assert.match(await page.getByTestId('codigo-bem').innerText(), /^BEM-\d{6,}$/);
  await page.getByText('Mesa de testes US025', { exact: true }).waitFor();
  assert.equal((await saved()).length, 1);
  console.log('PASS Gestor cadastra e confere código e dados persistidos');
  await page.getByRole('button', { name: 'Cadastrar outro', exact: true }).click();
  assert.equal(await page.locator('#descricao').inputValue(), '');
  assert.equal(await page.locator('#estado_conservacao').inputValue(), '');
  await fill(page);
  await page.locator('#data_aquisicao').fill('2024-06-01');
  await page.locator('#garantia_ate').fill('2024-05-31');
  await page.getByRole('button', { name: 'Salvar bem', exact: true }).click();
  await page.locator('#garantia_ate[aria-invalid="true"]').waitFor();
  assert.equal(await page.locator('#descricao').inputValue(), ' Mesa de testes US025 ');
  assert.equal((await saved()).length, 1);
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('link', { name: 'Cancelar', exact: true }).click();
  assert.equal(await page.locator('#descricao').inputValue(), ' Mesa de testes US025 ');
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('link', { name: 'Cancelar', exact: true }).click();
  await page.waitForURL(url + '/');
  assert.equal((await saved()).length, 1);
  console.log('PASS validação preserva campos, reset e descarte sem gravação');
  await page.getByRole('link', { name: 'Cadastrar bem', exact: true }).click();
  await fill(page);
  let lost = false;
  await page.route('**/patrimonios/novo', async route => {
    if (!lost && route.request().headers()['next-action']) {
      lost = true; await route.fetch(); await route.abort();
    } else await route.continue();
  });
  await page.getByRole('button', { name: 'Salvar bem', exact: true }).click();
  await page.getByRole('button', { name: 'Conferir cadastro', exact: true }).waitFor();
  assert.equal(lost, true);
  assert.equal(await page.locator('#descricao').isDisabled(), true);
  assert.equal(await page.locator('#descricao').inputValue(), ' Mesa de testes US025 ');
  assert.equal((await saved()).length, 2);
  await page.unrouteAll({ behavior: 'wait' });
  await page.getByRole('button', { name: 'Conferir cadastro', exact: true }).click();
  await page.getByRole('heading', { name: 'Bem cadastrado', exact: true }).waitFor();
  await page.getByText('Este bem já foi cadastrado. A confirmação foi recuperada.', { exact: true }).waitFor();
  assert.equal((await saved()).length, 2);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: '/private/tmp/fixit-us025-confirmacao.png', fullPage: true });
  console.log('PASS perda de resposta real, reenvio único e confirmação em tela móvel');
  assert.deepEqual(pageErrors, []);
} finally {
  await admin.from('bens_patrimoniais').delete().eq('autor_id', author);
  await admin.auth.admin.deleteUser(author);
  await browser.close();
}
