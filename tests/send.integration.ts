import assert from 'node:assert/strict';
import { test } from 'node:test';
import { criarSolicitacao } from '../src/server/requests.ts';
import { createRequestClient } from '../src/server/identity.ts';
import { localAdmin, cookieJar, uniqueSignup, createRoleUser } from './support/identity.ts';
const valid = { local: ' Sala  12 ', categoria_id: '20000000-0000-4000-8000-000000000001', assunto: 'US009', descricao: 'Manutenção' };
test('três papéis enviam em nome próprio com evento inicial', async () => {
  const admin = localAdmin();
  for (const papel of ['Cliente', 'Manutentor', 'Gestor']) {
    const signup = uniqueSignup();
    const user = await createRoleUser(admin, signup, papel);
    const client = createRequestClient(cookieJar());
    await client.auth.signInWithPassword({ email: signup.email, password: signup.password });
    try {
      const result = await criarSolicitacao(client, valid);
      assert.equal(result.erro, null); assert.ok(result.data);
      assert.equal(result.data.solicitante_id, user.data.user!.id);
      assert.equal(result.data.autor_id, user.data.user!.id);
      assert.equal(result.data.estado, 'Pendente');
      const events = await admin.from('historico_solicitacoes').select('*').eq('solicitacao_id', result.data.id);
      assert.equal(events.data?.length, 1);
      assert.equal(events.data![0].autor_id, user.data.user!.id);
    } finally {
      await admin.from('solicitacoes').delete().eq('autor_id', user.data.user!.id);
      await admin.auth.admin.deleteUser(user.data.user!.id);
    }
  }
});

test('Gestor representa qualquer papel; consultas acompanham solicitante e reenvio é único', async () => {
  const { obterSolicitacao, obterHistoricoSolicitacao, listarSolicitacoes } = await import('../src/server/requests.ts');
  const admin = localAdmin();
  const users: { id: string; signup: ReturnType<typeof uniqueSignup>; client: ReturnType<typeof createRequestClient> }[] = [];
  try {
    for (const papel of ['Gestor', 'Cliente', 'Manutentor', 'Gestor', 'Cliente']) {
      const signup = uniqueSignup(); const user = await createRoleUser(admin, signup, papel);
      const client = createRequestClient(cookieJar());
      await client.auth.signInWithPassword({ email: signup.email, password: signup.password });
      users.push({ id: user.data.user!.id, signup, client });
    }
    const [author, ...targets] = users;
    // Both non-manager roles must be refused at the public database boundary.
    for (const unauthorized of [users[1], users[2]]) {
      const attack = await unauthorized.client.rpc('us009_enviar_solicitacao', {
        dados: valid, tentativa: crypto.randomUUID(), identidade: unauthorized.id, solicitante: author.id,
      });
      assert.ok(attack.error);
    }
    for (const target of targets.slice(0, 3)) {
      const attempt = crypto.randomUUID();
      const results = await Promise.all(Array.from({ length: 4 }, () => criarSolicitacao(author.client, valid, attempt, target.id)));
      assert.ok(results.every(result => result.erro === null));
      const id = results[0].data!.id;
      assert.equal(new Set(results.map(result => result.data!.id)).size, 1);
      assert.equal(results.filter(result => !result.ja_registrada).length, 1);
      assert.equal(results[0].data!.autor_id, author.id);
      assert.equal(results[0].data!.solicitante_id, target.id);
      const foreignAttempt = await targets[3].client.rpc('us009_enviar_solicitacao', {
        dados: valid, tentativa: attempt, identidade: targets[3].id,
      });
      assert.ok(foreignAttempt.error, 'another identity cannot reuse a recorded attempt');
      const events = await admin.from('historico_solicitacoes').select('*').eq('solicitacao_id', id);
      assert.equal(events.data?.length, 1); assert.equal(events.data![0].autor_id, author.id);
      assert.equal(events.data![0].criado_em, results[0].data!.criado_em);
      if (target === targets[0]) {
        assert.equal((await obterSolicitacao(target.client, id)).data?.id, id);
        assert.equal((await listarSolicitacoes(target.client)).data?.total, 1);
        assert.equal((await obterHistoricoSolicitacao(target.client, id)).data?.[0].autor_id, author.id);
        assert.equal((await obterSolicitacao(targets[3].client, id)).erro, 'nao_encontrado');
      }
      // Same text is a distinct request when the attempt changes.
      assert.notEqual((await criarSolicitacao(author.client, valid, crypto.randomUUID(), target.id)).data?.id, id);
      // Terminal deletion does not prevent recovering an already committed result.
      const removed = await admin.rpc('us004_excluir_conta', { alvo: target.id, autor: author.id });
      assert.equal(removed.error, null);
      const retry = await criarSolicitacao(author.client, valid, attempt, target.id);
      assert.equal(retry.data?.id, id); assert.equal(retry.ja_registrada, true);
      assert.equal((await criarSolicitacao(author.client, valid, crypto.randomUUID(), target.id)).erro, 'solicitante_indisponivel');
      if (target === targets[0]) {
        await admin.auth.admin.deleteUser(target.id);
        const replacement = await createRoleUser(admin, target.signup, 'Cliente');
        const replacementId = replacement.data.user!.id;
        const replacementClient = createRequestClient(cookieJar());
        users.push({ id: replacementId, signup: target.signup, client: replacementClient });
        await replacementClient.auth.signInWithPassword({ email: target.signup.email, password: target.signup.password });
        assert.notEqual(replacementId, target.id);
        assert.equal((await obterSolicitacao(replacementClient, id)).erro, 'nao_encontrado');
        assert.equal((await listarSolicitacoes(replacementClient)).data?.total, 0);
        assert.equal((await criarSolicitacao(author.client, valid, attempt, target.id)).data?.solicitante_id, target.id);
        const fresh = await criarSolicitacao(author.client, valid, crypto.randomUUID(), replacementId);
        assert.equal(fresh.data?.solicitante_id, replacementId);
        assert.equal((await listarSolicitacoes(replacementClient)).data?.total, 1);
      }
    }
    for (const unauthorized of [users[4]]) {
      assert.equal((await criarSolicitacao(unauthorized.client, valid, crypto.randomUUID(), author.id)).erro, 'nao_autorizado');
      const attack = await unauthorized.client.rpc('us009_enviar_solicitacao', {
        dados: valid, tentativa: crypto.randomUUID(), identidade: unauthorized.id, solicitante: author.id,
      });
      assert.ok(attack.error);
    }
    const wrongIdentity = await users[4].client.rpc('us009_enviar_solicitacao', {
      dados: valid, tentativa: crypto.randomUUID(), identidade: author.id, solicitante: null,
    });
    assert.ok(wrongIdentity.error);
    for (const field of ['autor_id', 'id', 'estado', 'criado_em', 'prioridade']) {
      const attack = await author.client.rpc('us009_enviar_solicitacao', {
        dados: { ...valid, [field]: author.id }, tentativa: crypto.randomUUID(), identidade: author.id,
      });
      assert.ok(attack.error, field);
    }
  } finally {
    for (const user of users) await admin.from('solicitacoes').delete().eq('autor_id', user.id);
    for (const user of users) await admin.auth.admin.deleteUser(user.id);
  }
});

test('envio concorrente à exclusão tem vencedor consistente', async () => {
  const admin = localAdmin();
  const signup = uniqueSignup(); const author = await createRoleUser(admin, signup, 'Gestor');
  const authorId = author.data.user!.id;
  const client = createRequestClient(cookieJar());
  await client.auth.signInWithPassword({ email: signup.email, password: signup.password });
  const targets: string[] = [];
  try {
    for (let i = 0; i < 3; i++) {
      const target = await createRoleUser(admin, uniqueSignup(), 'Cliente'); const targetId = target.data.user!.id;
      targets.push(targetId);
      const attempt = crypto.randomUUID();
      const [send, deletion] = await Promise.all([
        criarSolicitacao(client, valid, attempt, targetId),
        admin.rpc('us004_excluir_conta', { alvo: targetId, autor: authorId }),
      ]);
      assert.equal(deletion.error, null);
      if (send.data) {
        assert.equal((await criarSolicitacao(client, valid, attempt, targetId)).data?.id, send.data.id);
        const history = await admin.from('historico_solicitacoes').select('id').eq('solicitacao_id', send.data.id);
        assert.equal(history.data?.length, 1);
      } else {
        assert.equal(send.erro, 'solicitante_indisponivel');
        assert.deepEqual((await admin.from('solicitacoes').select('id').eq('tentativa_id', attempt)).data, []);
      }
      assert.equal((await criarSolicitacao(client, valid, crypto.randomUUID(), targetId)).erro, 'solicitante_indisponivel');
    }
  } finally {
    await admin.from('solicitacoes').delete().eq('autor_id', authorId);
    for (const id of targets) await admin.auth.admin.deleteUser(id);
    await admin.auth.admin.deleteUser(authorId);
  }
});
