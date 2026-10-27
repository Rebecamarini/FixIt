import assert from 'node:assert/strict';
import { localAdmin, uniqueSignup, createRoleUser } from '../support/identity.ts';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const url = process.env.FIXIT_BROWSER_URL || 'http://127.0.0.1:3100';
assert.equal(new URL(url).hostname, '127.0.0.1');
const admin = localAdmin();
const browser = await chromium.launch();
const fixtures = [];
const fixturePrefix = `US007-${crypto.randomUUID()}`;
const actionIds = {};
const pageErrors = [];
async function login(page, email, password = 'Fixit-ficticio-123!') {
  await page.goto(`${url}/conta/entrar`);
  await page.locator('#email').fill(email); await page.locator('#senha').fill(password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click(); await page.waitForURL(`${url}/`);
}
async function discard(page) {
  await page.getByRole('link', { name: 'Cancelar', exact: true }).click();
  await page.getByRole('button', { name: 'Descartar preenchimento', exact: true }).click();
  await page.waitForURL(`${url}/`);
}

async function counts() {
  const result = {};
  for (const table of ['solicitacoes', 'historico_solicitacoes']) {
    const { count, error } = await admin.from(table).select('*', { count: 'exact', head: true });
    assert.equal(error, null); result[table] = count;
  }
  return result;
}
try {
  const before = await counts();
  for (const email of ['cliente1@fixit.example', 'manutentor@fixit.example', 'gestor@fixit.example']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 900 } });
    const page = await context.newPage();
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('request', request => {
      if (!request.headers()['next-action']) return;
      const body = request.postData() ?? '';
      if (body.startsWith('[{')) actionIds.validate = request.headers()['next-action'];
      else if (body.startsWith('["')) actionIds.search = request.headers()['next-action'];
      else if (body === '[]') actionIds.categories = request.headers()['next-action'];
    });
    await page.goto(`${url}/conta/entrar`);
    await page.locator('#email').fill(email); await page.locator('#senha').fill('Fixit-ficticio-123!');
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await page.waitForURL(`${url}/`);
    await page.getByRole('link', { name: 'Nova solicitação', exact: true }).click(); await page.waitForURL(`${url}/solicitacoes/nova`); await page.locator('#local').waitFor();
    await page.locator('#local').waitFor({ timeout: 5000 });
    await page.getByRole('button', { name: 'Validar preenchimento', exact: true }).click();
    await page.locator('#local[aria-invalid="true"]').waitFor();
    await page.waitForFunction(() => document.activeElement?.id === 'local');
    await page.locator('#local').fill('   ');
    assert.equal(await page.locator('#local').getAttribute('aria-invalid'), 'true');
    await page.locator('#motivo').fill('   ');
    await page.locator('#local').fill('  Sala  12  ');
    await page.locator('#assunto').fill('  Lâmpada  ');
    await page.locator('#descricao').fill('  Não acende  ');
    await page.locator('#categoria_id option').nth(1).waitFor({ state: 'attached' });
    await page.locator('#categoria_id').selectOption({ index: 1 });
    await page.getByRole('button', { name: 'Validar preenchimento', exact: true }).click();
    await page.getByText('Preenchimento válido. A solicitação ainda não foi enviada.', { exact: true }).waitFor();
    assert.equal(await page.locator('#local').inputValue(), 'Sala  12');
    assert.equal(await page.locator('#motivo').inputValue(), '');
    assert.equal(await page.locator('#urgencia, #prioridade, #setor_id, #manutentor_id, input[type=datetime-local]').count(), 0);
    await page.locator('#assunto').fill('Outro assunto');
    assert.equal(await page.getByText('Preenchimento válido. A solicitação ainda não foi enviada.', { exact: true }).count(), 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    if (email === 'gestor@fixit.example') {
      await page.getByLabel('Em nome de outra pessoa', { exact: true }).check();
      await page.getByLabel('Buscar por nome ou e-mail').fill('cliente1@fixit.example');
      await page.getByRole('button', { name: 'Buscar', exact: true }).click();
      await page.getByRole('button', { name: /Selecionar.*cliente1@fixit.example/ }).click();
      assert.equal(await page.locator('#local').inputValue(), 'Sala  12');
      await page.getByRole('button', { name: 'Validar preenchimento', exact: true }).click();
      await page.getByText('Preenchimento válido. A solicitação ainda não foi enviada.', { exact: true }).waitFor();
    }
    if (email === 'cliente1@fixit.example') {
      await page.evaluate(() => history.back());
      await page.getByRole('dialog', { name: 'Descartar preenchimento?' }).waitFor();
      await page.getByRole('button', { name: 'Continuar preenchendo', exact: true }).click();

      assert.equal(await page.locator('#local').inputValue(), 'Sala  12');
      const nativeWarning = new Promise(resolve => page.once('dialog', async dialog => { assert.equal(dialog.type(), 'beforeunload'); await dialog.dismiss(); resolve(); }));
      await page.reload({ timeout: 1500 }).catch(() => {});
      await Promise.race([nativeWarning, new Promise((_, reject) => setTimeout(() => reject(new Error('Native exit warning missing')), 5000))]);
    }
    await page.getByRole('link', { name: 'Cancelar', exact: true }).click();
    await page.getByRole('dialog', { name: 'Descartar preenchimento?' }).waitFor({ timeout: 5000 });
    await page.getByRole('button', { name: 'Continuar preenchendo', exact: true }).click();
    assert.equal(await page.locator('#local').inputValue(), 'Sala  12');
    await page.getByRole('link', { name: 'Cancelar', exact: true }).click();
    await page.getByRole('button', { name: 'Descartar preenchimento', exact: true }).click();
    await page.waitForURL(`${url}/`);
    await page.getByRole('link', { name: 'Nova solicitação', exact: true }).click(); await page.waitForURL(`${url}/solicitacoes/nova`);
    assert.equal(await page.locator('#local').inputValue(), '', 'Discarded drafts must not be recovered');
    await context.close(); console.log(`PASS flow ${email}`);
  }
  // Public Server Actions reject callers even if the selector is hidden in the UI.
  assert.ok(actionIds.search); assert.ok(actionIds.validate);
  for (const email of [null, 'cliente1@fixit.example', 'manutentor@fixit.example']) {
    const context = await browser.newContext(); const page = await context.newPage();
    if (email) await login(page, email);
    const response = await context.request.post(`${url}/solicitacoes/nova`, {
      headers: { 'Next-Action': actionIds.search, 'Content-Type': 'text/plain;charset=UTF-8', Origin: url }, data: '["",1]',
    });
    assert.match(await response.text(), /Você não tem permissão/);
    await context.close();
  }
  // Use disposable real accounts for pagination, homonyms and identity replacement.
  for (let index = 0; index < 21; index++) {
    const signup = uniqueSignup(); signup.options.data.nome = `${fixturePrefix} Pessoa ${String(index === 2 ? 1 : index).padStart(2, '0')}`;
    const role = ['Cliente', 'Manutentor', 'Gestor'][index % 3];
    const result = await createRoleUser(admin, signup, role); assert.equal(result.error, null);
    fixtures.push({ signup, id: result.data.user.id });
  }
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage(); page.on('pageerror', error => pageErrors.push(error.message));
  await login(page, 'gestor@fixit.example');
  await page.getByRole('link', { name: 'Nova solicitação', exact: true }).click(); await page.waitForURL(`${url}/solicitacoes/nova`); await page.locator('#local').waitFor();
  // Reversal to the original state removes the warning; search text alone is not dirty.
  await page.locator('#local').fill('x'); await page.locator('#local').fill('');
  await page.getByLabel('Em nome de outra pessoa', { exact: true }).check();
  await page.getByLabel('Buscar por nome ou e-mail').fill('only a search');
  await page.getByLabel('Em meu nome', { exact: true }).check();
  await page.getByRole('link', { name: 'Cancelar', exact: true }).click(); await page.waitForURL(`${url}/`);
  await page.getByRole('link', { name: 'Nova solicitação', exact: true }).click(); await page.waitForURL(`${url}/solicitacoes/nova`); await page.locator('#local').waitFor();
  // A pristine return to the form can have a Forward entry.
  await page.goBack(); await page.waitForURL(`${url}/`);
  await page.goForward(); await page.waitForURL(`${url}/solicitacoes/nova`);
  await page.getByRole('link', { name: 'Cancelar', exact: true }).click(); await page.waitForURL(`${url}/`);
  await page.goBack(); await page.waitForURL(`${url}/solicitacoes/nova`);
  await page.locator('#local').fill('Forward guard');
  await page.evaluate(() => history.forward());
  await page.getByRole('dialog', { name: 'Descartar preenchimento?' }).waitFor();
  await page.getByRole('button', { name: 'Continuar preenchendo', exact: true }).click();
  assert.equal(page.url(), `${url}/solicitacoes/nova`);
  assert.equal(await page.locator('#local').inputValue(), 'Forward guard');
  await page.locator('#local').fill('');
  for (let i = 0; i < 2; i++) {
    await page.getByRole('link', { name: 'Cancelar', exact: true }).click(); await page.waitForURL(`${url}/`);
    await page.getByRole('link', { name: 'Nova solicitação', exact: true }).click(); await page.waitForURL(`${url}/solicitacoes/nova`); await page.locator('#local').waitFor();
  }
  await page.locator('#local').fill('Multiple entries');
  await page.evaluate(() => history.go(-3));
  await page.getByRole('dialog', { name: 'Descartar preenchimento?' }).waitFor();
  await page.getByRole('button', { name: 'Continuar preenchendo', exact: true }).click();
  assert.equal(await page.locator('#local').inputValue(), 'Multiple entries');
  await page.locator('#local').fill('Sala'); await page.locator('#assunto').fill('Assunto'); await page.locator('#descricao').fill('Descrição');
  await page.locator('#categoria_id option').nth(1).waitFor({ state: 'attached' });
  await page.locator('#categoria_id').selectOption({ index: 1 });
  await page.getByLabel('Em nome de outra pessoa', { exact: true }).check();
  await page.getByLabel('Buscar por nome ou e-mail').fill(`${fixturePrefix} Pessoa`);
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await page.getByText('Página 1 — 21 contas', { exact: true }).waitFor();
  assert.equal(await page.locator('li button').count(), 20);
  const labels = await page.locator('li span').allTextContents();
  assert.match(labels[0], /Pessoa 00/); assert.match(labels[19], /Pessoa 19/);
  for (const role of ['Cliente', 'Manutentor', 'Gestor']) assert.ok(labels.some(text => text.endsWith(role)));
  await page.getByRole('button', { name: 'Próxima', exact: true }).click();
  await page.getByText('Página 2 — 21 contas', { exact: true }).waitFor();
  assert.equal(await page.locator('li button').count(), 1);
  await page.locator('li button').click();
  await page.getByRole('button', { name: 'Validar preenchimento', exact: true }).click();
  await page.getByText('Preenchimento válido. A solicitação ainda não foi enviada.', { exact: true }).waitFor();
  const target = fixtures.at(-1);
  const removal = await admin.rpc('us004_excluir_conta', { alvo: target.id, autor: (await admin.auth.admin.listUsers({ perPage: 1000 })).data.users.find(user => user.email === 'gestor@fixit.example').id });
  assert.equal(removal.error, null);
  assert.equal((await admin.auth.admin.deleteUser(target.id)).error, null);
  const replacement = await createRoleUser(admin, target.signup, 'Cliente'); assert.equal(replacement.error, null);
  fixtures.push({ signup: target.signup, id: replacement.data.user.id });
  assert.notEqual(target.id, replacement.data.user.id);
  await page.getByRole('button', { name: 'Validar preenchimento', exact: true }).click();
  await page.getByText('Selecione uma conta ativa. A conta escolhida pode ter sido excluída.', { exact: true }).waitFor();
  assert.equal(await page.locator('#local').inputValue(), 'Sala');
  assert.equal(await page.getByText(/Solicitante selecionado:/).count(), 0);
  await page.getByLabel('Buscar por nome ou e-mail').fill(target.signup.email);
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await page.getByText('Página 1 — 1 contas', { exact: true }).waitFor();
  await page.locator('li button').click();
  await page.getByRole('button', { name: 'Validar preenchimento', exact: true }).click();
  await page.getByText('Preenchimento válido. A solicitação ainda não foi enviada.', { exact: true }).waitFor();
  // Controlled transport failure leaves the real successful integration above intact.
  await page.route('**/solicitacoes/nova', route => route.request().headers()['next-action'] === actionIds.search ? route.abort() : route.continue());
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await page.getByText('Não foi possível consultar os solicitantes.', { exact: true }).waitFor();
  assert.equal(await page.locator('#local').inputValue(), 'Sala');
  await page.unroute('**/solicitacoes/nova');
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
  await page.getByText('Página 1 — 1 contas', { exact: true }).waitFor();
  await page.getByLabel('Buscar por nome ou e-mail').fill('nobody-us007');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await page.getByText('Nenhuma conta encontrada.', { exact: true }).waitFor();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await discard(page); await context.close();
  // Category transport failure, retry and controlled empty lookup are distinct states.
  const failureContext = await browser.newContext(); const failurePage = await failureContext.newPage();
  await login(failurePage, 'cliente1@fixit.example');
  await failurePage.route('**/solicitacoes/nova', route => route.request().headers()['next-action'] === actionIds.categories ? route.abort() : route.continue());
  await failurePage.getByRole('link', { name: 'Nova solicitação', exact: true }).click();
  await failurePage.getByText('Não foi possível consultar as categorias.', { exact: true }).waitFor();
  await failurePage.locator('#local').fill('Preservar');
  await failurePage.unroute('**/solicitacoes/nova');
  await failurePage.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
  await failurePage.locator('#categoria_id option').nth(1).waitFor({ state: 'attached' });
  assert.equal(await failurePage.locator('#local').inputValue(), 'Preservar');
  await discard(failurePage);
  await failurePage.route('**/solicitacoes/nova', async route => {
    if (route.request().headers()['next-action'] !== actionIds.categories) return route.continue();
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace(/"items":\[[^\]]*\]/g, '"items":[]') });
  });
  await failurePage.getByRole('link', { name: 'Nova solicitação', exact: true }).click();
  await failurePage.getByText('Não há categorias cadastradas. Não é possível concluir o preenchimento.', { exact: true }).waitFor();
  assert.equal(await failurePage.getByRole('button', { name: 'Tentar novamente', exact: true }).count(), 0);
  await failurePage.unrouteAll({ behavior: 'wait' });
  await failureContext.close();
  assert.deepEqual(await counts(), before);
  console.log('PASS US007 T1/T2/T3: roles, validation, focus, normalization, search, pagination, identity replacement, failures, navigation, no writes', { before, after: await counts(), pageErrors });
  assert.deepEqual(pageErrors, []);
} finally {
  await browser.close();
  for (const fixture of fixtures) await admin.auth.admin.deleteUser(fixture.id);
}
