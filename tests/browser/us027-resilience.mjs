import assert from 'node:assert/strict';
import { localAdmin, uniqueSignup, createRoleUser, cookieJar } from '../support/identity.ts';
import { createRequestClient } from '../../src/server/identity.ts';
import { cadastrarBem } from '../../src/server/assets.ts';
import { alterarBem, obterBemParaEdicao } from '../../src/server/asset-mutation.ts';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const url = process.env.FIXIT_BROWSER_URL || 'http://127.0.0.1:3102';
assert.equal(new URL(url).hostname, '127.0.0.1');
const admin = localAdmin();
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
const users = [], assets = [], contexts = [], pageErrors = [];
const original = { descricao: 'Bem de resiliência US027', localizacao: 'Sala inicial', estado_conservacao: 'Bom', marca: '', modelo: '', data_aquisicao: '', garantia_ate: '' };
async function loggedPage(user) {
  const context = await browser.newContext({ viewport: { width: 390, height: 900 } });
  contexts.push(context);
  const page = await context.newPage();
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto(url + '/conta/entrar');
  await page.locator('#email').fill(user.signup.email);
  await page.locator('#senha').fill(user.signup.password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.waitForURL(url + '/');
  return page;
}
async function mutate(user, asset, changes, acao = 'editar') {
  const read = await obterBemParaEdicao(user.client, asset.id);
  assert.ok(read.data);
  const dados = Object.fromEntries(Object.keys(original).map(key => [key, read.data[key] ?? '']));
  const result = await alterarBem(user.client, { id: asset.id, versao: read.data.versao, acao, dados: acao === 'editar' ? { ...dados, ...changes } : undefined, tentativa: crypto.randomUUID(), identidade: user.id });
  assert.equal(result.status, acao === 'editar' ? 'salvo' : 'arquivado', result.message);
  return result;
}
async function loseNextResponse(page, path) {
  let lost = false;
  await page.route('**' + path + '**', async route => {
    if (!lost && route.request().headers()['next-action']) {
      lost = true; await route.fetch(); await route.abort();
    } else await route.continue();
  });
  return () => assert.equal(lost, true);
}
try {
  for (const papel of ['Gestor', 'Gestor', 'Manutentor', 'Cliente']) {
    const signup = uniqueSignup();
    const created = await createRoleUser(admin, signup, papel);
    const client = createRequestClient(cookieJar());
    await client.auth.signInWithPassword({ email: signup.email, password: signup.password });
    users.push({ id: created.data.user.id, signup, client, papel });
  }
  const [owner, other, maintainer, customer] = users;
  for (let i = 0; i < 2; i++) {
    const result = await cadastrarBem(owner.client, original, crypto.randomUUID(), owner.id);
    assert.ok(result.confirmation); assets.push(result.confirmation);
  }
  const [asset, second] = assets;
  const details = `${url}/patrimonios/${asset.id}?busca=${asset.codigo}&pagina=1`;
  const edit = `${url}/patrimonios/${asset.id}/editar?busca=${asset.codigo}&pagina=1`;
  const archive = `${url}/patrimonios/${asset.id}/arquivar?busca=${asset.codigo}&pagina=1`;
  const page = await loggedPage(owner);
  await page.goto(edit);
  await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
  await page.getByText('Não há alterações para salvar.', { exact: true }).waitFor();
  assert.equal((await obterBemParaEdicao(owner.client, asset.id)).data.versao, 1);
  await page.locator('#descricao').fill('');
  await page.locator('#localizacao').fill('');
  await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
  await page.locator('#descricao[aria-invalid="true"]').waitFor();
  await page.waitForFunction(() => document.activeElement?.id === 'descricao');
  await page.locator('#descricao').pressSequentially('Mesa', { delay: 40 });
  assert.equal(await page.locator('#descricao').inputValue(), 'Mesa');
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'descricao');
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('link', { name: 'Cancelar', exact: true }).click();
  assert.equal(await page.locator('#descricao').inputValue(), 'Mesa');
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('link', { name: 'Cancelar', exact: true }).click();
  await page.getByRole('heading', { name: 'Detalhes do bem', exact: true }).waitFor();
  assert.equal((await obterBemParaEdicao(owner.client, asset.id)).data.descricao, original.descricao);
  console.log('PASS no-op, validação preservada e cancelamento sem gravação');

  await page.goto(edit);
  const lostNoop = await loseNextResponse(page, `/patrimonios/${asset.id}/editar`);
  await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
  await page.getByRole('button', { name: 'Conferir resultado', exact: true }).waitFor();
  lostNoop();
  await mutate(other, asset, { modelo: 'Modelo posterior à tentativa sem mudanças' });
  await page.unrouteAll({ behavior: 'wait' });
  await page.getByRole('button', { name: 'Conferir resultado', exact: true }).click();
  await page.getByRole('heading', { name: 'Detalhes do bem', exact: true }).waitFor({ timeout: 5000 });
  await page.getByText('Modelo posterior à tentativa sem mudanças', { exact: true }).waitFor();
  assert.ok(page.url().includes('resultado=sem_alteracoes_recuperado'));
  await page.getByRole('status').filter({ hasText: 'tentativa' }).waitFor();
  console.log('PASS resposta perdida sem mudança recupera confirmação distinta dos dados atuais');

  await page.goto(edit);
  await page.locator('#localizacao').fill('Minha mudança');
  await mutate(other, asset, { localizacao: 'Mudança do outro Gestor' });
  await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
  await page.getByRole('heading', { name: 'Conferir alterações de outro Gestor' }).waitFor();
  assert.equal(await page.locator('#localizacao').inputValue(), 'Minha mudança');
  await page.getByRole('cell', { name: 'Minha mudança', exact: true }).waitFor();
  await page.getByRole('cell', { name: 'Mudança do outro Gestor', exact: true }).waitFor();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: '/tmp/fixit-us027-conflito.png', fullPage: true });
  await page.getByRole('button', { name: 'Abrir versão atual para editar', exact: true }).click();
  assert.equal(await page.locator('#localizacao').inputValue(), 'Mudança do outro Gestor');
  await page.locator('#localizacao').fill('Mudança revisada');
  await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
  await page.getByRole('heading', { name: 'Detalhes do bem', exact: true }).waitFor();
  await page.getByText('Mudança revisada', { exact: true }).waitFor();
  console.log('PASS conflito com comparação e reaplicação manual');

  await page.goto(edit);
  await page.locator('#marca').fill('Marca com resposta perdida');
  const lostEdit = await loseNextResponse(page, `/patrimonios/${asset.id}/editar`);
  await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
  await page.getByRole('button', { name: 'Conferir resultado', exact: true }).waitFor();
  lostEdit();
  assert.equal(await page.locator('#marca').isDisabled(), true);
  assert.equal(await page.getByRole('link', { name: 'Cancelar', exact: true }).count(), 0);
  await mutate(other, asset, { localizacao: 'Versão posterior à resposta perdida' });
  const version = (await obterBemParaEdicao(owner.client, asset.id)).data.versao;
  await page.unrouteAll({ behavior: 'wait' });
  await page.getByRole('button', { name: 'Conferir resultado', exact: true }).click();
  await page.getByRole('heading', { name: 'Detalhes do bem', exact: true }).waitFor();
  await page.getByText('Versão posterior à resposta perdida', { exact: true }).waitFor();
  assert.equal((await obterBemParaEdicao(owner.client, asset.id)).data.versao, version);
  console.log('PASS resposta perdida da edição, recuperação e versão posterior preservada');

  await page.goto(archive);
  await mutate(other, asset, { descricao: 'Descrição atual para arquivar' });
  await page.getByRole('button', { name: 'Arquivar bem', exact: true }).click();
  await page.getByRole('button', { name: 'Conferir versão atual para arquivar', exact: true }).click();
  await page.getByRole('region', { name: 'Confirmação de arquivamento' }).getByText('Descrição atual para arquivar', { exact: false }).waitFor();
  const lostArchive = await loseNextResponse(page, `/patrimonios/${asset.id}/arquivar`);
  await page.getByRole('button', { name: 'Arquivar bem', exact: true }).click();
  await page.getByRole('button', { name: 'Conferir resultado', exact: true }).waitFor();
  lostArchive();
  assert.equal((await obterBemParaEdicao(owner.client, asset.id)).erro, 'nao_encontrado');
  await page.unrouteAll({ behavior: 'wait' });
  await page.getByRole('button', { name: 'Conferir resultado', exact: true }).click();
  await page.getByRole('heading', { name: 'Consultar bens', exact: true }).waitFor();
  assert.ok(page.url().includes('busca=' + asset.codigo));
  await page.getByText('Nenhum bem encontrado', { exact: true }).waitFor();
  await page.goto(details);
  await page.getByRole('heading', { name: 'Bem não encontrado', exact: true }).waitFor();
  console.log('PASS arquivamento exige nova conferência e recupera resposta perdida');

  await page.goto(`${url}/patrimonios/${second.id}/arquivar`);
  await mutate(other, second, {}, 'arquivar');
  await page.getByRole('button', { name: 'Arquivar bem', exact: true }).click();
  await page.getByRole('heading', { name: 'Consultar bens', exact: true }).waitFor();
  await page.getByText('O bem já foi arquivado por outro Gestor.', { exact: true }).waitFor();
  for (const user of [maintainer, customer]) {
    const p = await loggedPage(user);
    for (const action of ['editar', 'arquivar']) {
      await p.goto(`${url}/patrimonios/${second.id}/${action}`);
      await p.getByRole('heading', { name: 'Acesso restrito', exact: true }).waitFor();
      assert.equal(await p.locator('input, textarea, select').count(), 0);
    }
  }
  assert.deepEqual(pageErrors, []);
  console.log('PASS já arquivado e URLs de alteração restritas ao Gestor; sem erros JS');
} finally {
  for (const context of contexts) await context.close();
  await browser.close();
  if (assets.length) {
    const cleanup = await admin.from('bens_patrimoniais').delete().in('id', assets.map(asset => asset.id));
    assert.equal(cleanup.error, null);
  }
  for (const user of users) await admin.auth.admin.deleteUser(user.id);
}
