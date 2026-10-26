import assert from "node:assert/strict";
import { test } from "node:test";
import { criarConta, conferirCriacao, excluirConta, listarContas } from "../src/server/admin-accounts.ts";
import { createRequestClient, obterIdentidade } from "../src/server/identity.ts";
import { criarSolicitacao, listarSolicitacoes } from "../src/server/requests.ts";
import { cookieJar, localAdmin, uniqueSignup, createRoleUser } from "./support/identity.ts";

async function createUser(role: "Cliente" | "Manutentor" | "Gestor" = "Cliente") {
  const admin = localAdmin();
  const account = uniqueSignup();
  const created = await createRoleUser(admin, account, role);
  assert.equal(created.error, null); assert.ok(created.data.user);
  const jar = cookieJar();
  const client = createRequestClient(jar);
  assert.equal((await client.auth.signInWithPassword({ email: account.email, password: account.password })).error, null);
  return { admin, account, user: created.data.user, client, jar };
}

test("Gestor lista, filtra e pagina contas; criação mantém sua sessão e papel fixo", async () => {
  const gestor = await createUser("Gestor");
  const admin = gestor.admin;
  const fixtures = await Promise.all(Array.from({ length: 21 }, async (_, index) => {
    const account = uniqueSignup();
    const created = await admin.auth.admin.createUser({ email: account.email, password: account.password, email_confirm: true, user_metadata: { nome: `US004 Alpha ${String(index).padStart(2, "0")}` } });
    assert.equal(created.error, null); assert.ok(created.data.user);
    return { id: created.data.user.id, email: account.email };
  }));
  try {
    const first = await listarContas(gestor.client, { q: "us004 alpha", page: 1 });
    assert.equal(first.total, 21); assert.equal(first.items.length, 20);
    assert.deepEqual(first.items.map(item => item.nome), [...first.items.map(item => item.nome)].sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" })));
    assert.equal((await listarContas(gestor.client, { q: "us004 alpha", page: 2 })).items.length, 1);
    const filtered = await listarContas(gestor.client, { q: gestor.account.email, papel: "Gestor" });
    assert.equal(filtered.total, 1); assert.equal(filtered.items[0].id, gestor.user.id);
    assert.equal((await listarContas(createRequestClient(cookieJar()), {})).forbidden, true);
    for (const papel of ["Manutentor", "Gestor"]) {
      const form = new FormData();
      const email = `new-${crypto.randomUUID()}@example.test`;
      form.set("nome", `${papel} US004`); form.set("email", email);
      form.set("papel", papel); form.set("senha", "Inicial-local-123!");
      const result = await criarConta(gestor.client, form);
      assert.equal(result.success, true, result.message);
      assert.deepEqual(await obterIdentidade(createRequestClient(gestor.jar)), { id: gestor.user.id, papel: "Gestor" });
      const account = (await listarContas(gestor.client, { q: email })).items[0];
      assert.ok(account);
      try {
        const profile = await admin.from("perfis").select("nome,papel,matricula,setor_id").eq("id", account.id).single();
        assert.deepEqual(profile.data, { nome: `${papel} US004`, papel, matricula: null, setor_id: null });
        assert.ok((await admin.from("perfis").update({ papel: papel === "Gestor" ? "Cliente" : "Gestor" }).eq("id", account.id)).error);
        const login = createRequestClient(cookieJar());
        assert.equal((await login.auth.signInWithPassword({ email, password: "Inicial-local-123!" })).error, null);
        assert.deepEqual(await obterIdentidade(login), { id: account.id, papel });
        await login.auth.signOut({ scope: "local" });
      } finally { await admin.auth.admin.deleteUser(account.id); }
    }
  } finally {
    for (const fixture of fixtures) {
      await admin.auth.admin.deleteUser(fixture.id);
      await admin.from("perfis").delete().eq("id", fixture.id);
    }
    await gestor.client.auth.signOut({ scope: "local" });
    await admin.auth.admin.deleteUser(gestor.user.id);
    await admin.from("perfis").delete().eq("id", gestor.user.id);
  }
});

test("exclusão preserva identidade e histórico, bloqueia JWT antigo e libera e-mail sem herança", async () => {
  const gestor = await createUser("Gestor");
  const target = await createUser("Cliente");
  const request = await criarSolicitacao(target.client, {
    local: "Sala de teste", categoria_id: "20000000-0000-4000-8000-000000000001",
    assunto: `US004 ${crypto.randomUUID()}`, descricao: "Falha de manutenção fictícia.",
  });
  assert.equal(request.erro, null); assert.ok(request.data);
  const targetSession = (await target.client.auth.getSession()).data.session;
  assert.ok(targetSession);
  try {
    const selfDelete = await excluirConta(gestor.client, gestor.user.id);
    assert.equal(selfDelete.success, undefined); assert.match(selfDelete.message!, /própria conta/);
    const result = await excluirConta(gestor.client, target.user.id);
    assert.equal(result.success, true, result.message);
    const profile = await gestor.admin.from("perfis").select("id,nome,papel,excluido_em").eq("id", target.user.id).single();
    assert.equal(profile.data?.papel, "Cliente"); assert.ok(profile.data?.excluido_em);
    const audit = await gestor.admin.from("exclusoes_contas").select("conta_id,autor_id,excluido_em").eq("conta_id", target.user.id).single();
    assert.deepEqual(audit.data, { conta_id: target.user.id, autor_id: gestor.user.id, excluido_em: profile.data.excluido_em });
    const requestRow = await gestor.admin.from("solicitacoes").select("id,autor_id,estado").eq("id", request.data.id).single();
    assert.deepEqual(requestRow.data, { id: request.data.id, autor_id: target.user.id, estado: "Pendente" });
    const event = await gestor.admin.from("historico_solicitacoes").select("autor_id,estado_novo").eq("solicitacao_id", request.data.id).single();
    assert.deepEqual(event.data, { autor_id: target.user.id, estado_novo: "Pendente" });
    assert.deepEqual(await listarSolicitacoes(target.client), { data: null, erro: "nao_autenticado" });
    assert.equal((await target.client.from("solicitacoes").select("id").eq("id", request.data.id)).data?.length, 0);
    const secondDelete = await excluirConta(gestor.client, target.user.id);
    assert.equal(secondDelete.success, true); assert.match(secondDelete.message!, /já havia sido excluída/);
    const auditAgain = await gestor.admin.from("exclusoes_contas").select("id").eq("conta_id", target.user.id);
    assert.equal(auditAgain.data?.length, 1);
    assert.ok((await gestor.admin.from("exclusoes_contas").update({ autor_id: target.user.id }).eq("conta_id", target.user.id)).error);
    assert.ok((await gestor.admin.from("exclusoes_contas").delete().eq("conta_id", target.user.id)).error);
    const reSignupJar = cookieJar();
    const reSignupClient = createRequestClient(reSignupJar);
    const reSignup = await reSignupClient.auth.signUp({ email: target.account.email, password: "Novo-local-123!", options: { data: { nome: "Nova identidade" } } });
    assert.equal(reSignup.error, null); assert.ok(reSignup.data.user);
    assert.notEqual(reSignup.data.user.id, target.user.id);
    assert.equal((await reSignupClient.auth.signInWithPassword({ email: target.account.email, password: "Novo-local-123!" })).error, null);
    assert.deepEqual(await obterIdentidade(createRequestClient(reSignupJar)), { id: reSignup.data.user.id, papel: "Cliente" });
    assert.deepEqual(await listarSolicitacoes(createRequestClient(reSignupJar)).then(result => result.data?.itens), []);
    const newProfile = await gestor.admin.from("perfis").select("nome,papel").eq("id", reSignup.data.user.id).single();
    assert.deepEqual(newProfile.data, { nome: "Nova identidade", papel: "Cliente" });
    // Keep the old token to prove it cannot read the preserved request.
    await gestor.admin.auth.admin.deleteUser(reSignup.data.user.id);
    await gestor.admin.from("perfis").delete().eq("id", reSignup.data.user.id);
    await reSignupClient.auth.signOut({ scope: "local" });
  } finally {
    await target.client.auth.signOut({ scope: "local" });
    await gestor.client.auth.signOut({ scope: "local" });
    // The audit row is intentionally immutable and keeps its actor profile for history.
    await gestor.admin.auth.admin.deleteUser(gestor.user.id);
  }
});

test("Cliente, Manutentor e visitante não administram contas nem executam RPC privilegiada", async () => {
  const anon = createRequestClient(cookieJar());
  assert.equal((await listarContas(anon, {})).forbidden, true);
  for (const papel of ["Cliente", "Manutentor"] as const) {
    const fixture = await createUser(papel);
    try {
      assert.equal((await listarContas(fixture.client, {})).forbidden, true);
      assert.match((await criarConta(fixture.client, new FormData())).message!, /permissão/);
      assert.match((await excluirConta(fixture.client, fixture.user.id)).message!, /permissão/);
      assert.ok((await fixture.client.rpc("us004_excluir_conta", { alvo: fixture.user.id, autor: fixture.user.id })).error);
      assert.ok((await fixture.client.from("perfis").update({ matricula: "forjada", setor_id: null }).eq("id", fixture.user.id)).error);
    } finally { await fixture.admin.auth.admin.deleteUser(fixture.user.id); }
  }
});

test("exclusões simultâneas do mesmo alvo registram um único evento", async () => {
  const gestor = await createUser("Gestor"), target = await createUser();
  try {
    const results = await Promise.all([excluirConta(gestor.client, target.user.id), excluirConta(gestor.client, target.user.id)]);
    assert.equal(results.filter(result => result.success).length, 2);
    assert.equal(results.filter(result => /já havia/.test(result.message ?? "")).length, 1);
    const audit = await gestor.admin.from("exclusoes_contas").select("autor_id").eq("conta_id", target.user.id);
    assert.deepEqual(audit.data, [{ autor_id: gestor.user.id }]);
  } finally {
    await gestor.admin.auth.admin.deleteUser(target.user.id);
    await gestor.admin.auth.admin.deleteUser(gestor.user.id);
  }
});

test("exclusões mútuas concorrentes têm um vencedor e preservam um Gestor autorizado", async () => {
  const a = await createUser("Gestor"), b = await createUser("Gestor");
  try {
    const results = await Promise.all([excluirConta(a.client, b.user.id), excluirConta(b.client, a.user.id)]);
    assert.equal(results.filter(result => result.success).length, 1);
    assert.match(results.find(result => !result.success)!.message!, /permissão/);
    const profiles = await a.admin.from("perfis").select("id,excluido_em").in("id", [a.user.id, b.user.id]);
    assert.equal(profiles.data?.filter(profile => !profile.excluido_em).length, 1);
    const survivor = results[0].success ? a : b;
    assert.deepEqual(await obterIdentidade(survivor.client), { id: survivor.user.id, papel: "Gestor" });
    const loser = results[0].success ? b : a;
    assert.equal((await listarContas(loser.client, {})).forbidden, true);
    const audit = await a.admin.from("exclusoes_contas").select("autor_id,conta_id").in("conta_id", [a.user.id, b.user.id]);
    assert.deepEqual(audit.data, [{ autor_id: survivor.user.id, conta_id: loser.user.id }]);
  } finally {
    await a.admin.auth.admin.deleteUser(a.user.id);
    await a.admin.auth.admin.deleteUser(b.user.id);
  }
});

test("falha na remoção Auth não confirma exclusão completa; repetir libera o e-mail sem duplicar auditoria", async t => {
  const gestor = await createUser("Gestor"), target = await createUser();
  const originalFetch = globalThis.fetch;
  let fail = true;
  const boundary = t.mock.method(globalThis, "fetch", async (input: string | URL | Request, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    if (fail && url.endsWith(`/admin/users/${target.user.id}`) && init?.method === "DELETE") {
      return new Response(JSON.stringify({ message: "controlled provider outage" }), { status: 503, headers: { "content-type": "application/json" } });
    }
    return originalFetch(input, init);
  });
  try {
    const first = await excluirConta(gestor.client, target.user.id);
    assert.equal(first.success, undefined); assert.equal(first.retryable, true);
    assert.match(first.message!, /não foi possível confirmar/);
    assert.equal(await obterIdentidade(target.client), null);
    fail = false;
    assert.equal((await excluirConta(gestor.client, target.user.id)).success, true);
    assert.ok((await target.client.auth.signInWithPassword({ email: target.account.email, password: target.account.password })).error);
    const audit = await gestor.admin.from("exclusoes_contas").select("id").eq("conta_id", target.user.id);
    assert.equal(audit.data?.length, 1);
  } finally {
    boundary.mock.restore();
    await gestor.admin.auth.admin.deleteUser(target.user.id);
    await gestor.admin.auth.admin.deleteUser(gestor.user.id);
  }
});

test("falha de finalização conserva papel definitivo sem acesso e permite conferir a criação sem senha", async t => {
  const gestor = await createUser("Gestor");
  const originalFetch = globalThis.fetch;
  let fail = true;
  const boundary = t.mock.method(globalThis, "fetch", async (input: string | URL | Request, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    if (fail && url.endsWith("/rpc/us004_finalizar_criacao")) return new Response(JSON.stringify({ message: "controlled unavailable" }), { status: 503, headers: { "content-type": "application/json" } });
    return originalFetch(input, init);
  });
  let id: string | undefined;
  const email = `pending-${crypto.randomUUID()}@example.test`;
  try {
    const form = new FormData();
    form.set("nome", "Papel inicial preservado"); form.set("email", email); form.set("papel", "Manutentor"); form.set("senha", "Inicial-local-123!");
    const first = await criarConta(gestor.client, form);
    assert.ok(first.creationId); id = first.creationId;
    assert.equal(first.success, undefined);
    assert.match(first.message!, /Conferir criação/);
    assert.doesNotMatch(JSON.stringify(first), /Inicial-local/);
    const profile = await gestor.admin.from("perfis").select("papel,provisionamento_pendente").eq("id", id).single();
    assert.deepEqual(profile.data, { papel: "Manutentor", provisionamento_pendente: true });
    const client = createRequestClient(cookieJar());
    assert.equal((await client.auth.signInWithPassword({ email, password: "Inicial-local-123!" })).error, null);
    assert.equal(await obterIdentidade(client), null);
    assert.equal((await listarContas(gestor.client, { q: email })).total, 0);
    fail = false;
    assert.equal((await conferirCriacao(gestor.client, id)).success, true);
    assert.equal((await conferirCriacao(gestor.client, id)).success, true);
    assert.deepEqual(await obterIdentidade(client), { id, papel: "Manutentor" });
    assert.equal((await listarContas(gestor.client, { q: email })).total, 1);
  } finally {
    boundary.mock.restore();
    if (id) await gestor.admin.auth.admin.deleteUser(id);
    await gestor.admin.auth.admin.deleteUser(gestor.user.id);
  }
});

test("indisponibilidade ao verificar sessão não é apresentada como falta de permissão", async t => {
  const gestor = await createUser("Gestor");
  const originalFetch = globalThis.fetch;
  const boundary = t.mock.method(globalThis, "fetch", async (input: string | URL | Request, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url.endsWith("/auth/v1/user")) return new Response(JSON.stringify({ message: "private provider failure" }), { status: 503, headers: { "content-type": "application/json" } });
    return originalFetch(input, init);
  });
  try {
    const create = await criarConta(gestor.client, new FormData());
    const remove = await excluirConta(gestor.client, gestor.user.id);
    assert.match(create.message!, /Tente novamente/);
    assert.match(remove.message!, /Tente novamente/);
    assert.doesNotMatch(JSON.stringify([create, remove]), /permissão|private provider/);
    await assert.rejects(listarContas(gestor.client, {}), /verificar a sessão/);
  } finally {
    boundary.mock.restore();
    await gestor.admin.auth.admin.deleteUser(gestor.user.id);
  }
});
