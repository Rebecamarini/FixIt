import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { localAdmin } from '../support/identity.ts';

// Reuse an external Playwright installation, as in the US-002 browser validation.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const url = process.env.FIXIT_BROWSER_URL || 'http://127.0.0.1:3100';
assert.equal(new URL(url).hostname, '127.0.0.1', 'Run against the local application only.');
const admin = localAdmin();
const browser = await chromium.launch();
const errors = [];
const evidence = process.env.FIXIT_BROWSER_EVIDENCE || 'docs/evidencias/us-006';
mkdirSync(evidence, { recursive: true });
async function counts() {
  const result = {};
  for (const table of ['solicitacoes', 'historico_solicitacoes']) {
    const { count, error } = await admin.from(table).select('*', { count: 'exact', head: true });
    assert.equal(error, null);
    assert.equal(typeof count, 'number');
    result[table] = count;
  }
  return result;
}
async function login(page, email) {
  await page.goto(`${url}/conta/entrar`);
  await page.locator('#email').fill(email);
  await page.locator('#senha').fill('Fixit-ficticio-123!');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.waitForURL(`${url}/`);
  await page.getByRole('button', { name: 'Sair', exact: true }).waitFor();
}
async function protectedPage(page) {
  await page.getByRole('heading', { name: 'Nova solicitação de manutenção', exact: true }).waitFor();
  await page.getByRole('link', { name: 'Cancelar', exact: true }).waitFor();
  await page.locator('#local').waitFor();
  assert.equal(await page.locator('#categoria_id').inputValue(), '');
  assert.ok((await page.locator('main p').allTextContents()).some(text => /manutenção/i.test(text)));
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
}
async function loginRequired(page) {
  await page.waitForURL(`${url}/conta/entrar`);
  await page.getByRole('heading', { name: 'Entrar', exact: true }).waitFor();
  assert.equal(await page.getByRole('heading', { name: 'Nova solicitação de manutenção', exact: true }).count(), 0);
}
try {
  const before = await counts();
  for (const width of [390, 1440]) {
    for (const [role, email, name] of [
      ['Cliente', 'cliente1@fixit.example', 'Cliente Um (fictício)'],
      ['Manutentor', 'manutentor@fixit.example', 'Manutentor (fictício)'],
      ['Gestor', 'gestor@fixit.example', 'Gestor (fictício)'],
    ]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      page.on('dialog', () => assert.fail('Opening/cancelling must not ask for confirmation.'));
      await page.goto(url);
      assert.equal(await page.getByRole('link', { name: 'Nova solicitação', exact: true }).count(), 0);
      const denied = await context.request.get(`${url}/solicitacoes/nova`, { maxRedirects: 0 });
      assert.equal(denied.status(), 307);
      assert.equal(denied.headers().location, '/conta/entrar');
      await page.goto(`${url}/solicitacoes/nova`);
      await loginRequired(page);
      await login(page, email);
      await page.getByText(`Olá, ${name}!`, { exact: true }).waitFor();
      await page.getByRole('link', { name: 'Nova solicitação', exact: true }).click();
      await page.waitForURL(`${url}/solicitacoes/nova`);
      await protectedPage(page);
      const reloaded = await page.reload();
      assert.match(reloaded.headers()['cache-control'], /(?:private, )?no-store/);
      await protectedPage(page);
      await page.screenshot({ path: `${evidence}/${role.toLowerCase()}-${width}.png`, fullPage: true });
      await page.getByRole('link', { name: 'Cancelar', exact: true }).click();
      await page.waitForURL(`${url}/`);
      await page.getByText(`Olá, ${name}!`, { exact: true }).waitFor();
      await page.goto(`${url}/solicitacoes/nova`);
      await protectedPage(page);
      await page.getByRole('link', { name: 'Cancelar', exact: true }).click();
      await page.waitForURL(`${url}/`);
      await page.getByRole('button', { name: 'Sair', exact: true }).click();
      await loginRequired(page);
      await page.goBack();
      await page.goBack();
      await loginRequired(page);
      await page.goto(`${url}/solicitacoes/nova`);
      await loginRequired(page);
      await context.close();
      console.log(`PASS ${role} ${width}px: real login, entry, direct access, reload, cancel, logout, history, layout`);
    }
  }
  // Keep a real session, revoke its refresh token via logout, then force expiry
  // only in the test cookie. Neither server time nor Auth responses are mocked.
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await login(page, 'cliente1@fixit.example');
  const sessionCookies = (await context.cookies()).filter(cookie => cookie.name.startsWith('sb-'));
  const joined = [...sessionCookies].sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true })).map(cookie => cookie.value).join('');
  assert.ok(joined.startsWith('base64-'));
  const session = JSON.parse(Buffer.from(joined.slice(7), 'base64url').toString());
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await loginRequired(page);
  const cookieName = sessionCookies[0].name.replace(/\.\d+$/, '');
  for (const [kind, value] of [
    ['invalid', { ...session, access_token: 'invalid-token', refresh_token: 'invalid-refresh', expires_at: Math.floor(Date.now() / 1000) + 3600 }],
    ['nonrenewable', { ...session, expires_at: 1 }],
  ]) {
    await context.clearCookies();
    await context.addCookies([{ name: cookieName, value: `base64-${Buffer.from(JSON.stringify(value)).toString('base64url')}`, url }]);
    await page.goto(`${url}/solicitacoes/nova`);
    await loginRequired(page);
    console.log(`PASS ${kind} session: login required, no protected page`);
  }
  await context.close();
  const after = await counts();
  assert.deepEqual(after, before, 'Opening, reloading, cancelling and denied accesses must not write requests or history.');
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ before, after, pageErrors: errors }));
} finally {
  await browser.close();
}
