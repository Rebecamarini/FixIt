import assert from "node:assert/strict";
import { test } from "node:test";
import { consultarPerfil, salvarPerfil } from "../src/server/profile.ts";
import { createRequestClient } from "../src/server/identity.ts";
import { localAdmin, cookieJar, uniqueSignup } from "./support/identity.ts";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

async function fixture(papel = "Cliente") {
  const admin = localAdmin();
  if (!process.env.SUPABASE_SECRET_KEY) throw new Error("Configure a chave local restrita para testar alteração de e-mail (ADR 0004).");
  const signup = uniqueSignup();
  const created = await admin.auth.admin.createUser({ email: signup.email, password: signup.password, email_confirm: true, user_metadata: signup.options.data });
  assert.equal(created.error, null);
  const id = created.data.user!.id;
  assert.equal((await admin.from("perfis").update({ papel }).eq("id", id)).error, null);
  const jar = cookieJar();
  const client = createRequestClient(jar);
  assert.equal((await client.auth.signInWithPassword({ email: signup.email, password: signup.password })).error, null);
  return { admin, signup, id, jar, client, cleanup: () => admin.auth.admin.deleteUser(id) };
}

test("perfil próprio: três papéis consultam, normalizam e persistem os três campos atomicamente", async () => {
  for (const papel of ["Cliente", "Manutentor", "Gestor"]) {
    const f = await fixture(papel);
    try {
      const original = await consultarPerfil(f.client);
      assert.equal(original?.papel, papel);
      assert.equal(original?.email, f.signup.email);
      const values = { nome: " \ufeff Pessoa editada \u00a0", matricula: `  00Ab-${f.id}  `, setor_id: "10000000-0000-4000-8000-000000000002" };
      const result = await salvarPerfil(f.client, form(values));
      assert.equal(result.success, true);
      const persisted = await consultarPerfil(createRequestClient(f.jar));
      assert.equal(persisted?.nome, "Pessoa editada");
      assert.equal(persisted?.matricula, `00Ab-${f.id}`);
      assert.equal(persisted?.setor_id, values.setor_id);
      assert.equal((await salvarPerfil(f.client, form({ ...values, matricula: persisted!.matricula }))).success, true);
      assert.ok(!(await salvarPerfil(f.client, form({ ...values, nome: "Não salvar", setor_id: "99999999-9999-4999-8999-999999999999" }))).success);
      assert.deepEqual(await consultarPerfil(createRequestClient(f.jar)), persisted);
      assert.equal((await salvarPerfil(f.client, form({ ...values, nome: "Último salvamento" }))).success, true);
      assert.equal((await consultarPerfil(createRequestClient(f.jar)))?.nome, "Último salvamento");
    } finally { await f.cleanup(); }
  }
});

test("perfil: concorrência por matrícula, isolamento, validação e proteção de ID/papel", async () => {
  const a = await fixture("Gestor");
  const b = await fixture();
  try {
    const values = { nome: "Pessoa", matricula: `00Conc-${a.id}`, setor_id: a.signup.options.data.setor_id };
    const results = await Promise.all([salvarPerfil(a.client, form(values)), salvarPerfil(b.client, form({ ...values, matricula: values.matricula.toLowerCase() }))]);
    assert.equal(results.filter(r => r.success).length, 1);
    assert.equal(results.filter(r => r.errors?.matricula).length, 1);
    const before = await consultarPerfil(a.client);
    assert.ok((await salvarPerfil(a.client, form({ ...values, nome: " \ufeff " }))).errors?.nome);
    for (const [key, value] of [["id", b.id], ["papel", "Cliente"], ["user_id", b.id]]) {
      assert.ok(!(await salvarPerfil(a.client, form({ ...values, [key]: value }))).success);
    }
    assert.ok((await a.client.from("perfis").update({ papel: "Cliente" }).eq("id", a.id)).error);
    assert.ok((await a.client.from("perfis").update({ id: b.id }).eq("id", a.id)).error);
    assert.deepEqual((await a.client.from("perfis").select("id").eq("id", b.id)).data, []);
    assert.deepEqual((await a.client.from("perfis").update({ nome: "Ataque" }).eq("id", b.id).select()).data, []);
    assert.deepEqual(await consultarPerfil(a.client), before);
    assert.equal((await salvarPerfil(createRequestClient(cookieJar()), form(values))).sessionLost, true);
  } finally { await a.cleanup(); await b.cleanup(); }
});

test("e-mail: senha atual, validação, troca imediata e sessões preservadas", async () => {
  const { alterarEmail } = await import("../src/server/profile.ts");
  const f = await fixture();
  const second = createRequestClient(cookieJar());
  try {
    assert.equal((await second.auth.signInWithPassword({ email: f.signup.email, password: f.signup.password })).error, null);
    const newEmail = `new-${f.id}@example.test`;
    const data = form({ email: newEmail, senha_atual: "incorreta" });
    assert.ok((await alterarEmail(f.client, data)).errors?.senha_atual);
    data.set("senha_atual", f.signup.password);
    data.set("email", "invalido");
    assert.ok((await alterarEmail(f.client, data)).errors?.email);
    data.set("email", newEmail);
    const result = await alterarEmail(f.client, data);
    assert.equal(result.success, true, JSON.stringify(result));
    assert.equal(result.email, newEmail);
    assert.equal((await consultarPerfil(createRequestClient(f.jar)))?.email, newEmail);
    assert.equal((await f.client.auth.refreshSession()).error, null);
    assert.equal((await second.auth.refreshSession()).error, null);
    const fresh = createRequestClient(cookieJar());
    assert.ok((await fresh.auth.signInWithPassword({ email: f.signup.email, password: f.signup.password })).error);
    assert.equal((await fresh.auth.signInWithPassword({ email: newEmail, password: f.signup.password })).error, null);
    await fresh.auth.signOut({ scope: "local" });
  } finally { await f.cleanup(); }
});

test("senha: validação, credencial nova e somente sessão atual renovável", async () => {
  const { alterarSenha } = await import("../src/server/profile.ts");
  const f = await fixture();
  const other = createRequestClient(cookieJar());
  try {
    assert.equal((await other.auth.signInWithPassword({ email: f.signup.email, password: f.signup.password })).error, null);
    const token = (await other.auth.getSession()).data.session!.refresh_token;
    for (const [current, next, confirmation] of [["errada", "Nova-local-123!", "Nova-local-123!"], [f.signup.password, "curta", "curta"], [f.signup.password, f.signup.password, f.signup.password], [f.signup.password, "Nova-local-123!", "diferente"]]) {
      const result = await alterarSenha(f.client, form({ senha_atual: current, nova_senha: next, confirmar_senha: confirmation }));
      assert.ok(!result.success);
      assert.ok(result.errors);
      assert.ok(!JSON.stringify(result).includes(f.signup.password));
    }
    const result = await alterarSenha(f.client, form({ senha_atual: f.signup.password, nova_senha: "Nova-local-123!", confirmar_senha: "Nova-local-123!" }));
    assert.equal(result.success, true, JSON.stringify(result));
    assert.equal((await f.client.auth.refreshSession()).error, null);
    assert.equal((await consultarPerfil(createRequestClient(f.jar)))?.id, f.id);
    assert.ok((await createRequestClient(cookieJar()).auth.refreshSession({ refresh_token: token })).error);
    const fresh = createRequestClient(cookieJar());
    assert.ok((await fresh.auth.signInWithPassword({ email: f.signup.email, password: f.signup.password })).error);
    assert.equal((await fresh.auth.signInWithPassword({ email: f.signup.email, password: "Nova-local-123!" })).error, null);
    await fresh.auth.signOut({ scope: "local" });
  } finally { await f.cleanup(); }
});

test("senha: falha de revogação informa resultado parcial e repetição não troca senha novamente", async (t) => {
  const { alterarSenha, encerrarOutrasSessoes } = await import("../src/server/profile.ts");
  const f = await fixture();
  const fetch = globalThis.fetch;
  let failureStatus = 503;
  const failure = t.mock.method(globalThis, "fetch", async (input: string | URL | Request, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url.includes("/logout?scope=others")) return new Response(JSON.stringify({ message: "controlled outage" }), { status: failureStatus, headers: { "content-type": "application/json" } });
    return fetch(input, init);
  });
  try {
    const result = await alterarSenha(f.client, form({ senha_atual: f.signup.password, nova_senha: "Nova-parcial-123!", confirmar_senha: "Nova-parcial-123!" }));
    assert.equal(result.partial, true);
    assert.ok(!result.success);
    assert.match(result.message!, /senha foi alterada/);
    failureStatus = 429;
    const limited = await encerrarOutrasSessoes(f.client);
    assert.equal(limited.partial, true);
    assert.match(limited.message!, /Aguarde/);
    failure.mock.restore();
    assert.equal((await encerrarOutrasSessoes(createRequestClient(f.jar))).success, true);
    assert.equal((await f.client.auth.refreshSession()).error, null);
    const fresh = createRequestClient(cookieJar());
    assert.equal((await fresh.auth.signInWithPassword({ email: f.signup.email, password: "Nova-parcial-123!" })).error, null);
    await fresh.auth.signOut({ scope: "local" });
  } finally { failure.mock.restore(); await f.cleanup(); }
});

test("e-mail: concorrência tem um vencedor, duplicata não altera conta e não envia mensagens", async () => {
  const { alterarEmail } = await import("../src/server/profile.ts");
  const a = await fixture("Gestor"), b = await fixture("Manutentor");
  const mailCount = async () => (await (await fetch("http://127.0.0.1:54324/api/v1/messages")).json()).total;
  try {
    const before = await mailCount();
    const target = `shared-${a.id}@example.test`;
    const results = await Promise.all([a, b].map(f => alterarEmail(f.client, form({ email: target, senha_atual: f.signup.password }))));
    assert.equal(results.filter(r => r.success).length, 1);
    const loser = results[0].success ? b : a;
    assert.ok((await alterarEmail(loser.client, form({ email: target, senha_atual: loser.signup.password }))).errors?.email);
    assert.equal((await consultarPerfil(loser.client))?.email, loser.signup.email);
    assert.equal(await mailCount(), before);
    for (const f of [a, b]) {
      const original = await consultarPerfil(f.client);
      assert.ok((await alterarEmail(f.client, form({ email: `attack-${f.id}@example.test` }))).errors?.senha_atual);
      assert.ok(!(await alterarEmail(f.client, form({ email: target, senha_atual: f.signup.password, id: f === a ? b.id : a.id }))).success);
      assert.deepEqual(await consultarPerfil(f.client), original);
    }
  } finally { await a.cleanup(); await b.cleanup(); }
});

test("falhas de rede e limite de tentativas recebem orientação sem dados secretos", async (t) => {
  const { alterarSenha, alterarEmail } = await import("../src/server/profile.ts");
  const f = await fixture();
  const originalFetch = globalThis.fetch;
  const failure = t.mock.method(globalThis, "fetch", async (input: string | URL | Request, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url.includes("/rest/v1/perfis") && init?.method === "PATCH") return new Response(JSON.stringify({ message: "internal SQL stack" }), { status: 503 });
    if (url.includes("/token?grant_type=password")) return new Response(JSON.stringify({ code: "over_request_rate_limit", message: "internal limit" }), { status: 429 });
    return originalFetch(input, init);
  });
  try {
    const uncertain = await salvarPerfil(f.client, form({ nome: "Nome", matricula: `00-${f.id}`, setor_id: f.signup.options.data.setor_id }));
    assert.match(uncertain.message!, /confirmar a gravação/);
    const limited = await alterarSenha(f.client, form({ senha_atual: f.signup.password, nova_senha: "Outra-local-123!", confirmar_senha: "Outra-local-123!" }));
    assert.match(limited.message!, /Muitas tentativas/);
    const noSession = await alterarEmail(createRequestClient(cookieJar()), form({ email: "teste@example.test", senha_atual: f.signup.password }));
    assert.equal(noSession.sessionLost, true);
    assert.doesNotMatch(JSON.stringify([uncertain, limited, noSession]), /internal|SQL|stack|Teste-local-123/);
  } finally { failure.mock.restore(); await f.cleanup(); }
});
