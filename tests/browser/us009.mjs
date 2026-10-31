import assert from 'node:assert/strict';
import { localAdmin, uniqueSignup, createRoleUser } from '../support/identity.ts';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const url = process.env.FIXIT_BROWSER_URL || 'http://127.0.0.1:3102';
assert.equal(new URL(url).hostname, '127.0.0.1');
const admin = localAdmin();
const browser = await chromium.launch();
const prefix = 'US009-' + crypto.randomUUID();
const errors = [];
async function login(page, email) {
  await page.goto(url + '/conta/entrar');
  await page.locator('#email').fill(email); await page.locator('#senha').fill('Fixit-ficticio-123!');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click(); await page.waitForURL(url + '/');
}
async function fill(page) {
  await page.locator('#local').fill(' Sala  12 ');
  await page.locator('#assunto').fill(prefix); await page.locator('#descricao').fill(' Lâmpada apagada ');
  await page.locator('#categoria_id option').nth(1).waitFor({ state: 'attached' });
  await page.locator('#categoria_id').selectOption({ index: 1 });
}
async function saved() {
  const rows = await admin.from('solicitacoes').select('*').eq('assunto', prefix);
  assert.equal(rows.error, null); return rows.data;
}
try {
  for (const role of ['cliente1', 'manutentor', 'gestor']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 900 } });
    const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message));
    await login(page, role + '@fixit.example');
    await page.getByRole('link', { name: 'Nova solicitação', exact: true }).click();
    await page.getByRole('button', { name: 'Enviar solicitação', exact: true }).click();
    await page.locator('#local[aria-invalid="true"]').waitFor();
    await page.waitForFunction(() => document.activeElement?.id === 'local');
    await fill(page);
    const before = (await saved()).length;
    // Real commit, but response is lost between the application and browser.
    let lost = false;
    await page.route('**/solicitacoes/nova', async route => {
      if (!lost && route.request().headers()['next-action'] && (route.request().postData() ?? '').includes(prefix)) {
        lost = true; await route.fetch(); await route.abort();
      } else await route.continue();
    });
    await page.getByRole('button', { name: 'Enviar solicitação', exact: true }).click();
    await page.getByRole('button', { name: 'Enviar novamente', exact: true }).waitFor();
    assert.equal(await page.locator('#local').isDisabled(), true);
    assert.equal(await page.locator('#local').inputValue(), ' Sala  12 ');
    assert.equal((await saved()).length, before + 1);
    await page.unrouteAll({ behavior: 'wait' });
    await page.getByRole('button', { name: 'Enviar novamente', exact: true }).click();
    await page.getByRole('heading', { name: 'Solicitação registrada', exact: true }).waitFor();
    await page.getByText('Esta solicitação já foi registrada.', { exact: true }).waitFor();
    assert.equal((await saved()).length, before + 1);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.getByRole('button', { name: 'Nova solicitação', exact: true }).click();
    assert.equal(await page.locator('#local').inputValue(), '');
    await fill(page);
    await page.getByRole('button', { name: 'Enviar solicitação', exact: true }).click();
    await page.getByRole('heading', { name: 'Solicitação registrada', exact: true }).waitFor();
    assert.equal((await saved()).length, before + 2);
    await context.close(); console.log('PASS own submission, lost response, retry, new identical request:', role);
  }
  const context = await browser.newContext(); const page = await context.newPage();
  await login(page, 'gestor@fixit.example');
  await page.getByRole('link', { name: 'Nova solicitação', exact: true }).click();
  for (const target of ['cliente1', 'manutentor', 'gestor']) {
    await fill(page);
    await page.getByLabel('Em nome de outra pessoa', { exact: true }).check();
    await page.getByLabel('Buscar por nome ou e-mail').fill(target + '@fixit.example');
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    await page.getByRole('button', { name: new RegExp('Selecionar.*' + target + '@fixit.example') }).click();
    await page.getByRole('button', { name: 'Enviar solicitação', exact: true }).click();
    await page.getByRole('heading', { name: 'Solicitação registrada', exact: true }).waitFor();
    if (target !== 'gestor') {
      await page.getByText(/^Solicitante:/).waitFor(); await page.getByText(/^Autor do envio:/).waitFor();
    }
    await page.getByRole('button', { name: 'Nova solicitação', exact: true }).click();
  }
  // Category disappears after loading: editable field error preserves other data.
  const category = crypto.randomUUID();
  assert.equal((await admin.from('categorias').insert({ id: category, nome: prefix })).error, null);
  await page.reload();
  await fill(page); await page.locator('#categoria_id').selectOption(category);
  assert.equal((await admin.from('categorias').delete().eq('id', category)).error, null);
  await page.getByRole('button', { name: 'Enviar solicitação', exact: true }).click();
  await page.locator('#categoria_id[aria-invalid="true"]').waitFor();
  assert.equal(await page.locator('#local').isDisabled(), false);
  assert.equal(await page.locator('#local').inputValue(), ' Sala  12 ');
  await page.locator('#categoria_id').selectOption({ index: 1 });

  // Deletion after selection requires explicit reselection, never substitutes author.
  const signup = uniqueSignup(); const target = await createRoleUser(admin, signup, 'Cliente');
  const targetId = target.data.user.id;
  try {
    await page.getByLabel('Em nome de outra pessoa', { exact: true }).check();
    await page.getByLabel('Buscar por nome ou e-mail').fill(signup.email);
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    await page.getByRole('button', { name: new RegExp('Selecionar.*' + signup.email) }).click();
    const gestor = (await admin.auth.admin.listUsers({ perPage: 1000 })).data.users.find(u => u.email === 'gestor@fixit.example');
    assert.equal((await admin.rpc('us004_excluir_conta', { alvo: targetId, autor: gestor.id })).error, null);
    await page.getByRole('button', { name: 'Enviar solicitação', exact: true }).click();
    await page.getByText('Selecione uma conta ativa. A conta escolhida pode ter sido excluída.', { exact: true }).waitFor();
    assert.equal(await page.locator('#local').inputValue(), ' Sala  12 ');
    assert.equal(await page.getByText(/Solicitante selecionado:/).count(), 0);
    await page.getByLabel('Em meu nome', { exact: true }).check();
  } finally { await admin.auth.admin.deleteUser(targetId); }

  // Open page survives lost session; another identity cannot submit its attempt.
  await context.clearCookies();
  const countBeforeSession = (await saved()).length;
  await page.getByRole('button', { name: 'Enviar solicitação', exact: true }).click();
  await page.getByRole('button', { name: 'Enviar novamente', exact: true }).waitFor();
  const warning = new Promise(resolve => page.once('dialog', async dialog => {
    assert.equal(dialog.type(), 'beforeunload'); await dialog.dismiss(); resolve();
  }));
  await page.reload({ timeout: 1500 }).catch(() => {});
  await Promise.race([warning, new Promise((_, reject) => setTimeout(() => reject(new Error('Missing exit warning')), 5000))]);
  await page.getByRole('link', { name: 'Cancelar', exact: true }).click();
  await page.getByText(/A solicitação pode já estar registrada/).waitFor();
  await page.getByRole('button', { name: 'Continuar preenchendo', exact: true }).click();
  const tab = await context.newPage();
  await login(tab, 'cliente2@fixit.example');
  await page.getByRole('button', { name: 'Enviar novamente', exact: true }).click();
  await page.getByText('Entre novamente com a conta que abriu este formulário.', { exact: true }).waitFor();
  assert.equal((await saved()).length, countBeforeSession);
  await context.clearCookies(); await login(tab, 'gestor@fixit.example');
  await page.getByRole('button', { name: 'Enviar novamente', exact: true }).click();
  await page.getByRole('heading', { name: 'Solicitação registrada', exact: true }).waitFor();
  assert.equal((await saved()).length, countBeforeSession + 1);
  await context.close();
  console.log('PASS category correction, deleted requester, native exit warning, session and identity recovery');
  const rows = await saved();
  for (const row of rows) {
    const events = await admin.from('historico_solicitacoes').select('*').eq('solicitacao_id', row.id);
    assert.equal(events.error, null); assert.equal(events.data.length, 1);
    assert.equal(events.data[0].autor_id, row.autor_id);
    assert.equal(events.data[0].criado_em, row.criado_em);
    assert.equal(row.local, 'Sala  12');
  }
  assert.deepEqual(errors, []);
  console.log('PASS representation, confirmation, normalization and atomic history', rows.length);
} finally {
  await browser.close();
  await admin.from('solicitacoes').delete().eq('assunto', prefix);
}
