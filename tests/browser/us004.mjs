import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { localAdmin, createRoleUser, uniqueSignup } from '../support/identity.ts';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const url = process.env.FIXIT_BROWSER_URL || 'http://127.0.0.1:3100';
assert.equal(new URL(url).hostname, '127.0.0.1');
const admin = localAdmin();
const fixtures = [];
const cleanup = new Set();
const evidence = 'docs/evidencias/us-004';
mkdirSync(evidence, { recursive: true });
const browser = await chromium.launch();
const errors = [];
async function accountByEmail(email) {
  const result = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  assert.equal(result.error, null);
  return result.data.users.find(user => user.email === email);
}
async function login(page, email, password) {
  await page.goto(`${url}/conta/entrar`);
  await page.locator('#email').fill(email); await page.locator('#senha').fill(password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.waitForURL(`${url}/`);
}
function watch(page) { page.on('pageerror', error => errors.push(error.message)); }
async function fits(page) { assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); }
try {
  for (const papel of ['Cliente', 'Manutentor', 'Gestor']) {
    const signup = uniqueSignup(); signup.options.data.nome = `UIUS004 ${papel}`;
    const result = await createRoleUser(admin, signup, papel);
    cleanup.add(result.data.user.id); fixtures.push({ papel, signup, user: result.data.user });
  }
  const gestor = fixtures.find(fixture => fixture.papel === 'Gestor');
  const cliente = fixtures.find(fixture => fixture.papel === 'Cliente');
  for (const width of [390, 1440]) {
    const anon = await browser.newContext({ viewport: { width, height: 900 } });
    const denied = await anon.request.get(`${url}/usuarios`, { maxRedirects: 0 });
    assert.equal(denied.status(), 307); assert.equal(denied.headers().location, '/');
    await anon.close();
    for (const fixture of fixtures.filter(fixture => fixture.papel !== 'Gestor')) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage(); watch(page);
      await login(page, fixture.signup.email, fixture.signup.password);
      assert.equal(await page.getByRole('link', { name: 'Gerenciar usuários', exact: true }).count(), 0);
      await page.goto(`${url}/usuarios`); await page.waitForURL(`${url}/`);
      await page.goto(`${url}/usuarios/nova`); await page.waitForURL(`${url}/`);
      await page.goto(`${url}/conta/perfil`);
      assert.equal(await page.locator('#matricula, #setor_id').count(), 0);
      await page.getByText(`Papel: ${fixture.papel}`, { exact: true }).waitFor(); await fits(page);
      await context.close();
    }
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage(); watch(page);
    await login(page, gestor.signup.email, gestor.signup.password);
    await page.getByRole('link', { name: 'Gerenciar usuários', exact: true }).click();
    await page.getByRole('heading', { name: 'Gerenciar usuários', exact: true }).waitFor();
    const listing = await page.goto(`${url}/usuarios?q=${encodeURIComponent(gestor.signup.email)}`);
    assert.match(listing.headers()['cache-control'], /private, no-store/);
    assert.equal(await page.locator('tbody tr').count(), 1);
    assert.equal(await page.getByRole('button', { name: /Excluir conta de/ }).count(), 0);
    await page.screenshot({ path: `${evidence}/gestao-${width}.png`, fullPage: true }); await fits(page);
    await page.getByRole('link', { name: 'Criar usuário', exact: true }).click();
    await page.waitForURL(`${url}/usuarios/nova`); await page.locator('#papel').waitFor();
    assert.equal(await page.locator('#matricula, #setor_id').count(), 0);
    assert.deepEqual(await page.locator('#papel option').allTextContents(), ['Selecione o papel', 'Manutentor', 'Gestor']);
    const cancelEmail = `cancel-${crypto.randomUUID()}@example.test`;
    await page.locator('#nome').fill('Cancelamento sem conta'); await page.locator('#email').fill(cancelEmail);
    await page.locator('#papel').selectOption('Gestor'); await page.locator('#senha').fill('Inicial-local-123!');
    await page.getByRole('link', { name: 'Cancelar', exact: true }).click();
    await page.waitForURL(`${url}/usuarios`); assert.equal(await accountByEmail(cancelEmail), undefined);
    await page.getByRole('link', { name: 'Criar usuário', exact: true }).click();
    assert.equal(await page.locator('#senha').inputValue(), '');
    await page.locator('#nome').fill('Dados preservados'); await page.locator('#email').fill('invalido');
    await page.locator('#papel').selectOption('Gestor'); await page.locator('#senha').fill('curta');
    await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Confira os campos' }).waitFor();
    assert.equal(await page.locator('#senha').inputValue(), '');
    assert.equal(await page.locator('#nome').inputValue(), 'Dados preservados');
    assert.equal(await page.locator('#email').inputValue(), 'invalido');
    assert.equal(await page.locator('#papel').inputValue(), 'Gestor');
    await page.locator('#email').fill(cliente.signup.email); await page.locator('#papel').selectOption('Manutentor');
    await page.locator('#senha').fill('Inicial-local-123!');
    await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Confira o e-mail' }).waitFor();
    assert.equal(await page.locator('#senha').inputValue(), '');
    assert.equal(await page.locator('#email').inputValue(), cliente.signup.email);
    assert.equal(await page.locator('#papel').inputValue(), 'Manutentor');
    await page.screenshot({ path: `${evidence}/criacao-erro-${width}.png`, fullPage: true }); await fits(page);
    const email = `ui-${width}-${crypto.randomUUID()}@example.test`;
    const name = `UIUS004 Novo ${width}`;
    await page.locator('#nome').fill(name); await page.locator('#email').fill(email);
    await page.locator('#senha').fill('Inicial-local-123!');
    await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
    await page.waitForURL(current => current.pathname === '/usuarios' && current.searchParams.get('criada') === '1');
    await page.getByRole('status').filter({ hasText: 'Conta criada com sucesso' }).waitFor();
    assert.equal(await page.locator('tbody tr').count(), 1); assert.match(await page.locator('tbody').innerText(), /Manutentor/);
    const created = await accountByEmail(email); assert.ok(created); cleanup.add(created.id);
    const staffContext = await browser.newContext(); const staff = await staffContext.newPage(); watch(staff);
    await login(staff, email, 'Inicial-local-123!'); await staff.goto(`${url}/conta/perfil`);
    await staff.getByText('Papel: Manutentor', { exact: true }).waitFor(); await staffContext.close();
    await page.goto(url); await page.getByText(`Olá, ${gestor.signup.options.data.nome}!`, { exact: true }).waitFor();
    await page.goto(`${url}/usuarios?q=${encodeURIComponent(email)}`);
    await page.getByRole('button', { name: `Excluir conta de ${name}`, exact: true }).click();
    let dialog = page.getByRole('dialog', { name: 'Excluir conta', exact: true }); await dialog.waitFor();
    assert.match(await dialog.innerText(), new RegExp(email.replaceAll('.', '\\.')));
    assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Cancelar');
    await page.keyboard.press('Tab'); assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Confirmar exclusão');
    await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'hidden' });
    assert.ok(await accountByEmail(email));
    const canceledAudit = await admin.from('exclusoes_contas').select('id').eq('conta_id', created.id);
    assert.deepEqual(canceledAudit.data, []);
    await page.getByRole('button', { name: `Excluir conta de ${name}`, exact: true }).click();
    dialog = page.getByRole('dialog', { name: 'Excluir conta', exact: true }); await dialog.waitFor();
    await page.screenshot({ path: `${evidence}/exclusao-${width}.png`, fullPage: true }); await fits(page);
    await page.keyboard.press('Tab'); await page.keyboard.press('Enter');
    await dialog.waitFor({ state: 'hidden' });
    await page.getByRole('status').filter({ hasText: 'Conta excluída' }).waitFor();
    await page.getByText('Nenhum usuário encontrado.', { exact: true }).waitFor();
    assert.equal(await page.locator('tbody tr').count(), 0); assert.equal(await accountByEmail(email), undefined);
    await context.close();
    const signupContext = await browser.newContext({ viewport: { width, height: 900 } });
    const signupPage = await signupContext.newPage(); watch(signupPage);
    await signupPage.goto(`${url}/conta/cadastrar`);
    assert.equal(await signupPage.locator('#matricula, #setor_id').count(), 0);
    await signupPage.locator('#nome').fill('Cliente independente'); await signupPage.locator('#email').fill(email);
    await signupPage.locator('#senha').fill('Nova-local-123!');
    await signupPage.getByRole('button', { name: 'Criar conta', exact: true }).click();
    await signupPage.waitForURL(`${url}/conta/entrar?cadastro=concluido`);
    await login(signupPage, email, 'Nova-local-123!'); await signupPage.goto(`${url}/conta/perfil`);
    await signupPage.getByText('Papel: Cliente', { exact: true }).waitFor();
    const independent = await accountByEmail(email); assert.ok(independent); assert.notEqual(independent.id, created.id); cleanup.add(independent.id);
    await signupContext.close();
    console.log(`PASS ${width}px: roles, access, cache, cancel, validation, password clearing, create, keyboard delete, email reuse`);
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
  for (const id of cleanup) await admin.auth.admin.deleteUser(id);
}
