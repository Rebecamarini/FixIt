import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cadastrarBem } from '../src/server/assets.ts';
import { listarBens, obterBem } from '../src/server/asset-query.ts';
import { createRequestClient } from '../src/server/identity.ts';
import { localAdmin, cookieJar, uniqueSignup, createRoleUser } from './support/identity.ts';

test('Gestor e Manutentor consultam ativos de outros autores e dados opcionais sem conceder escrita', async () => {
  const admin = localAdmin();
  const users = [];
  try {
    for (const papel of ['Gestor', 'Manutentor']) {
      const signup = uniqueSignup();
      const user = await createRoleUser(admin, signup, papel);
      const client = createRequestClient(cookieJar());
      await client.auth.signInWithPassword({ email: signup.email, password: signup.password });
      users.push({ id: user.data.user!.id, client });
    }
    const creation = await cadastrarBem(users[0].client, { descricao: 'Cadeira', localizacao: 'Sala 1', estado_conservacao: 'Péssimo', marca: '', modelo: '', data_aquisicao: '', garantia_ate: '' }, crypto.randomUUID(), users[0].id);
    assert.ok(creation.confirmation, creation.message);
    const saved = { data: creation.confirmation };
    for (const { client } of users) {
      const result = await listarBens(client, saved.data!.codigo);
      assert.equal(result.erro, null);
      assert.equal(result.data?.total, 1);
      assert.equal(result.data?.itens[0].id, saved.data!.id);
      const detail = await obterBem(client, saved.data!.id);
      assert.equal(detail.data?.marca, null);
      assert.equal(detail.data?.estado_conservacao, 'Péssimo');
      assert.equal('tentativa_id' in detail.data!, false);
      assert.equal('autor_id' in detail.data!, false);
      assert.ok((await client.from('bens_patrimoniais').select('*')).error);
      assert.ok((await client.from('bens_patrimoniais').update({ descricao: 'Forjada' }).eq('id', saved.data!.id)).error);
    }
  } finally {
    await admin.from('bens_patrimoniais').delete().in('autor_id', users.map(u => u.id));
    for (const user of users) await admin.auth.admin.deleteUser(user.id);
  }
});

test('busca literal, ordem numérica e páginas de 10 consultam somente ativos', async () => {
  const admin = localAdmin();
  const signup = uniqueSignup();
  const user = await createRoleUser(admin, signup, 'Gestor');
  const id = user.data.user!.id;
  const client = createRequestClient(cookieJar());
  await client.auth.signInWithPassword({ email: signup.email, password: signup.password });
  try {
    const created = [];
    for (let i = 0; i < 12; i++) {
      const r = await cadastrarBem(client, { descricao: 'Mesa', localizacao: 'Sala', estado_conservacao: ['Novo','Bom','Regular','Ruim','Péssimo'][i % 5], marca: '', modelo: '', data_aquisicao: '', garantia_ate: '' }, crypto.randomUUID(), id);
      assert.ok(r.confirmation, r.message); created.push(r.confirmation);
    }
    const ids = created.map(x => x.id);
    // Same timestamp makes the numeric tie breaker observable, including seven digits.
    for (let i = 0; i < ids.length; i++) {
      const r = await admin.from('bens_patrimoniais').update({ numero: 900000 + i, criado_em: '2030-01-01T00:00:00Z' }).eq('id', ids[i]);
      assert.equal(r.error, null);
    }
    assert.equal((await admin.from('bens_patrimoniais').update({ numero: 1000000 }).eq('id', ids[11])).error, null);
    const first = await listarBens(client, 'BEM-');
    assert.equal(first.data?.itens.length, 10);
    assert.equal(first.data?.itens[0].codigo, 'BEM-1000000');
    assert.equal(first.data?.itens[1].codigo, 'BEM-900010');
    const second = await listarBens(client, '9000', 2);
    assert.equal(second.data?.total, 11);
    assert.equal(second.data?.itens.length, 1);
    assert.equal(second.data?.itens[0].codigo, 'BEM-900000');
    assert.equal((await listarBens(client, '9000', 999)).data?.pagina, 2);
    assert.equal((await listarBens(client, '9000', -1)).data?.pagina, 1);
    for (const busca of ['%', '_', '*', '\\', 'Mesa']) assert.equal((await listarBens(client, busca)).data?.total, 0);
    assert.equal((await listarBens(client, ' \tbem-9000\u00a0')).data?.total, 11);
    const direct = await client.rpc('us026_listar_bens', { busca: ' \tbem-9000\u00a0', pagina: 1 });
    assert.equal(direct.data?.total, 11);
    assert.equal((await admin.from('bens_patrimoniais').update({ ativo: false }).eq('id', ids[0])).error, null);
    assert.equal((await listarBens(client, '9000')).data?.total, 10);
    assert.equal((await obterBem(client, ids[0])).erro, 'nao_encontrado');
    assert.equal((await obterBem(client, crypto.randomUUID())).erro, 'nao_encontrado');
    assert.equal((await obterBem(client, 'invalid')).erro, 'nao_encontrado');
    assert.deepEqual((await client.from('bens_patrimoniais').select('id').eq('id', ids[0])).data, []);
  } finally {
    await admin.from('bens_patrimoniais').delete().eq('autor_id', id);
    await admin.auth.admin.deleteUser(id);
  }
});

test('Cliente, visitante, conta excluída e provisionamento pendente não recebem inventário mesmo com sessão existente', async () => {
  const admin = localAdmin();
  const users = [];
  try {
    for (const papel of ['Gestor', 'Cliente', 'Manutentor', 'Manutentor']) {
      const signup = uniqueSignup();
      const user = await createRoleUser(admin, signup, papel);
      const client = createRequestClient(cookieJar());
      await client.auth.signInWithPassword({ email: signup.email, password: signup.password });
      users.push({ id: user.data.user!.id, client });
    }
    const created = await cadastrarBem(users[0].client, { descricao: 'Protegido', localizacao: 'Sala', estado_conservacao: 'Novo', marca: '', modelo: '', data_aquisicao: '', garantia_ate: '' }, crypto.randomUUID(), users[0].id);
    assert.ok(created.confirmation);
    assert.equal((await admin.from('perfis').update({ excluido_em: new Date().toISOString() }).eq('id', users[2].id)).error, null);
    assert.equal((await admin.from('perfis').update({ provisionamento_pendente: true }).eq('id', users[3].id)).error, null);
    const denied = [...users.slice(1).map(u => u.client), createRequestClient(cookieJar())];
    for (const client of denied) {
      assert.equal((await listarBens(client)).data, null);
      assert.equal((await obterBem(client, created.confirmation.id)).data, null);
      assert.ok((await client.rpc('us026_listar_bens', { busca: '', pagina: 1 })).error);
      const direct = await client.from('bens_patrimoniais').select('id,codigo');
      assert.ok(direct.error || direct.data?.length === 0);
      assert.ok((await client.from('bens_patrimoniais').insert({ descricao: 'Forjada' })).error);
      assert.ok((await client.from('bens_patrimoniais').delete().eq('id', created.confirmation.id)).error);
    }
    await users[0].client.auth.signOut();
    assert.equal((await listarBens(users[0].client)).erro, 'nao_autenticado');
    assert.equal((await obterBem(users[0].client, created.confirmation.id)).erro, 'nao_autenticado');
  } finally {
    await admin.from('bens_patrimoniais').delete().in('autor_id', users.map(u => u.id));
    for (const user of users) await admin.auth.admin.deleteUser(user.id);
  }
});
