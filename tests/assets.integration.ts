import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cadastrarBem } from '../src/server/assets.ts';
import { createRequestClient } from '../src/server/identity.ts';
import { localAdmin, cookieJar, uniqueSignup, createRoleUser } from './support/identity.ts';

const valid = { descricao: ' Cadeira ', localizacao: ' Sala 12 ', estado_conservacao: 'Péssimo', marca: '', modelo: '', data_aquisicao: '', garantia_ate: '' };

test('Gestor cadastra bem individual ativo com código automático e dados opcionais ausentes', async () => {
  const admin = localAdmin();
  const signup = uniqueSignup();
  const user = await createRoleUser(admin, signup, 'Gestor');
  const id = user.data.user!.id;
  const client = createRequestClient(cookieJar());
  await client.auth.signInWithPassword({ email: signup.email, password: signup.password });
  try {
    const result = await cadastrarBem(client, valid, crypto.randomUUID(), id);
    assert.ok(result.confirmation, result.message);
    assert.match(result.confirmation.codigo, /^BEM-\d{6,}$/);
    assert.equal(result.confirmation.descricao, 'Cadeira');
    assert.equal(result.confirmation.localizacao, 'Sala 12');
    assert.equal(result.confirmation.estado_conservacao, 'Péssimo');
    assert.equal(result.confirmation.ativo, true);
    assert.equal(result.confirmation.marca, null);
    assert.equal(result.confirmation.modelo, null);
    assert.equal(result.confirmation.data_aquisicao, null);
    assert.equal(result.confirmation.garantia_ate, null);
    const saved = await admin.from('bens_patrimoniais').select('id,codigo,ativo').eq('id', result.confirmation.id).single();
    assert.equal(saved.error, null);
    assert.equal(saved.data!.codigo, result.confirmation.codigo);
  } finally {
    await admin.from('bens_patrimoniais').delete().eq('autor_id', id);
    await admin.auth.admin.deleteUser(id);
  }
});

test('tentativa concorrente e reenvio recuperam um bem; cadastros iguais independentes têm códigos distintos', async () => {
  const admin = localAdmin();
  const signup = uniqueSignup();
  const user = await createRoleUser(admin, signup, 'Gestor');
  const id = user.data.user!.id;
  const client = createRequestClient(cookieJar());
  await client.auth.signInWithPassword({ email: signup.email, password: signup.password });
  try {
    const attempt = crypto.randomUUID();
    const concurrent = await Promise.all(Array.from({ length: 5 }, () => cadastrarBem(client, valid, attempt, id)));
    for (const result of concurrent) assert.ok(result.confirmation, result.message);
    const original = concurrent[0].confirmation!;
    assert.equal(new Set(concurrent.map(result => result.confirmation!.id)).size, 1);
    assert.equal(concurrent.filter(result => !result.confirmation!.repetida).length, 1);
    // Lost browser response: repeat the same request after the transaction committed.
    const retry = await cadastrarBem(client, valid, attempt, id);
    assert.deepEqual(retry.confirmation, { ...original, repetida: true });
    const changed = await cadastrarBem(client, { ...valid, descricao: 'Não substituir o original' }, attempt, id);
    assert.equal(changed.confirmation?.descricao, 'Cadeira');
    const identical = await Promise.all(Array.from({ length: 4 }, () => cadastrarBem(client, valid, crypto.randomUUID(), id)));
    assert.equal(new Set([original.codigo, ...identical.map(result => result.confirmation!.codigo)]).size, 5);
    const rows = await admin.from('bens_patrimoniais').select('id').eq('autor_id', id);
    assert.equal(rows.data?.length, 5);
    const archived = await admin.from('bens_patrimoniais').update({ ativo: false }).eq('id', original.id);
    assert.equal(archived.error, null);
    const afterArchive = await cadastrarBem(client, valid, crypto.randomUUID(), id);
    assert.ok(afterArchive.confirmation);
    assert.notEqual(afterArchive.confirmation.codigo, original.codigo);
  } finally {
    await admin.from('bens_patrimoniais').delete().eq('autor_id', id);
    await admin.auth.admin.deleteUser(id);
  }
});

test('valida campos e datas pela operação pública e também pela chamada direta ao banco', async () => {
  const admin = localAdmin();
  const signup = uniqueSignup();
  const user = await createRoleUser(admin, signup, 'Gestor');
  const id = user.data.user!.id;
  const client = createRequestClient(cookieJar());
  await client.auth.signInWithPassword({ email: signup.email, password: signup.password });
  try {
    const cases = [
      { descricao: ' \t\n\u00a0 ' }, { localizacao: '  ' }, { estado_conservacao: '' },
      { estado_conservacao: 'Inservível' }, { descricao: 'd'.repeat(501) },
      { localizacao: 'l'.repeat(201) }, { marca: 'm'.repeat(101) }, { modelo: 'm'.repeat(101) },
      { data_aquisicao: '9999-01-01' }, { data_aquisicao: '2025-02-29' },
      { garantia_ate: '2026-13-01' }, { garantia_ate: '2026-02-30' },
      { data_aquisicao: '2024-06-01', garantia_ate: '2024-05-31' },
      { garantia_ate: '0000-01-01' }, { garantia_ate: 'infinity' },
    ];
    for (const fields of cases) {
      const input = { ...valid, ...fields };
      const result = await cadastrarBem(client, input, crypto.randomUUID(), id);
      assert.equal(result.confirmation, undefined, JSON.stringify(fields));
      assert.ok(result.errors, JSON.stringify(fields));
      const direct = await client.rpc('us025_cadastrar_bem', { dados: input, tentativa: crypto.randomUUID(), identidade: id });
      assert.ok(direct.error, JSON.stringify(fields));
    }
    for (const field of ['id', 'codigo', 'numero', 'autor_id', 'ativo', 'tentativa_id', 'criado_em']) {
      const data = { ...valid, [field]: 'forjado' };
      assert.equal((await cadastrarBem(client, data, crypto.randomUUID(), id)).confirmation, undefined);
      const direct = await client.rpc('us025_cadastrar_bem', { dados: data, tentativa: crypto.randomUUID(), identidade: id });
      assert.ok(direct.error, field);
    }
    for (const dados of [null, [], 'texto', { ...valid, marca: 4 }, { ...valid, descricao: null }]) {
      const direct = await client.rpc('us025_cadastrar_bem', { dados, tentativa: crypto.randomUUID(), identidade: id });
      assert.ok(direct.error, JSON.stringify(dados));
    }
    assert.equal((await cadastrarBem(client, valid, 'invalid', id)).confirmation, undefined);
    const before = await admin.from('bens_patrimoniais').select('id').eq('autor_id', id);
    assert.equal(before.data?.length, 0);
    const complete = { ...valid, descricao: 'd'.repeat(500), localizacao: 'l'.repeat(200), marca: 'm'.repeat(100), modelo: 'm'.repeat(100), data_aquisicao: '2024-02-29', garantia_ate: '2024-02-29' };
    assert.ok((await cadastrarBem(client, complete, crypto.randomUUID(), id)).confirmation);
    for (const state of ['Novo', 'Bom', 'Regular', 'Ruim', 'Péssimo']) {
      const result = await cadastrarBem(client, { ...valid, estado_conservacao: state, garantia_ate: '2020-01-01' }, crypto.randomUUID(), id);
      assert.equal(result.confirmation?.estado_conservacao, state);
      assert.equal(result.confirmation?.garantia_ate, '2020-01-01');
      assert.equal(result.confirmation?.data_aquisicao, null);
    }
    assert.ok((await cadastrarBem(client, { ...valid, data_aquisicao: '2024-01-01' }, crypto.randomUUID(), id)).confirmation);
  } finally {
    await admin.from('bens_patrimoniais').delete().eq('autor_id', id);
    await admin.auth.admin.deleteUser(id);
  }
});

test('cadastro exige Gestor ativo e protege chamadas diretas e tentativas de outra identidade', async () => {
  const admin = localAdmin();
  const users: { id: string; client: ReturnType<typeof createRequestClient> }[] = [];
  try {
    for (const papel of ['Gestor', 'Gestor', 'Cliente', 'Manutentor']) {
      const signup = uniqueSignup();
      const user = await createRoleUser(admin, signup, papel);
      const client = createRequestClient(cookieJar());
      await client.auth.signInWithPassword({ email: signup.email, password: signup.password });
      users.push({ id: user.data.user!.id, client });
    }
    const attempt = crypto.randomUUID();
    const [owner, other, ...denied] = users;
    const first = await cadastrarBem(owner.client, valid, attempt, owner.id);
    assert.ok(first.confirmation);
    for (const user of [...denied, { id: owner.id, client: createRequestClient(cookieJar()) }]) {
      assert.equal((await cadastrarBem(user.client, valid, crypto.randomUUID(), user.id)).confirmation, undefined);
      const direct = await user.client.rpc('us025_cadastrar_bem', { dados: valid, tentativa: crypto.randomUUID(), identidade: user.id });
      assert.ok(direct.error);
    }
    assert.equal((await cadastrarBem(owner.client, valid, crypto.randomUUID(), other.id)).confirmation, undefined);
    const borrowed = await other.client.rpc('us025_cadastrar_bem', { dados: valid, tentativa: attempt, identidade: other.id });
    assert.equal(borrowed.error?.code, '42501');
    for (const user of users) {
      assert.ok((await user.client.from('bens_patrimoniais').insert({ ...valid, autor_id: user.id, tentativa_id: crypto.randomUUID() })).error);
      assert.ok((await user.client.from('bens_patrimoniais').update({ descricao: 'Alterado' }).eq('id', first.confirmation.id)).error);
      assert.ok((await user.client.from('bens_patrimoniais').delete().eq('id', first.confirmation.id)).error);
      assert.ok((await user.client.from('bens_patrimoniais').select('*')).error);
    }
    const excluded = await admin.rpc('us004_excluir_conta', { alvo: owner.id, autor: other.id });
    assert.equal(excluded.error, null);
    const afterDeletion = await owner.client.rpc('us025_cadastrar_bem', { dados: valid, tentativa: attempt, identidade: owner.id });
    assert.equal(afterDeletion.error?.code, '42501');
    const rows = await admin.from('bens_patrimoniais').select('id').in('autor_id', users.map(user => user.id));
    assert.equal(rows.data?.length, 1);
  } finally {
    const ids = users.map(user => user.id);
    await admin.from('bens_patrimoniais').delete().in('autor_id', ids);
    // Account deletion audit is retained in production, removed only for these disposable fixtures.
    await admin.from('exclusoes_contas').delete().in('conta_id', ids);
    for (const user of users) await admin.auth.admin.deleteUser(user.id);
  }
});
