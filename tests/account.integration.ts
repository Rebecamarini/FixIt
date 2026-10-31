import assert from "node:assert/strict";
import { test } from "node:test";
import { cadastrarCliente, entrarNaConta, sairDaConta } from "../src/server/account.ts";
import { listarSolicitacoes } from "../src/server/requests.ts";
import { createRequestClient, obterIdentidade } from "../src/server/identity.ts";
import { localAdmin, cookieJar, uniqueSignup } from "./support/identity.ts";

test("Cliente, Manutentor e Gestor entram e mantêm sua identidade após renovação e nova requisição", async (t) => {
  const admin = localAdmin();
  for (const papel of ["Cliente", "Manutentor", "Gestor"] as const) {
    await t.test(papel, async () => {
      const signup = uniqueSignup();
      const created = await admin.auth.admin.createUser({ email: signup.email, password: signup.password, email_confirm: true, user_metadata: signup.options.data });
      assert.equal(created.error, null);
      assert.ok(created.data.user);
      const id = created.data.user.id;
      const jar = cookieJar();
      const client = createRequestClient(jar);
      try {
        // Mesmo procedimento administrativo de preparação dos papéis de teste.
        assert.equal((await admin.from("perfis").update({ papel }).eq("id", id)).error, null);
        const login = new FormData();
        login.set("email", `  ${signup.email}  `);
        login.set("senha", signup.password);
        assert.deepEqual(await entrarNaConta(client, login), { success: true });
        assert.deepEqual(await obterIdentidade(createRequestClient(jar)), { id, papel });
        const profile = await createRequestClient(jar).from("perfis").select("nome").single();
        assert.equal(profile.error, null);
        assert.equal(profile.data.nome, signup.options.data.nome);
        assert.equal((await createRequestClient(jar).auth.refreshSession()).error, null);
        assert.deepEqual(await obterIdentidade(createRequestClient(jar)), { id, papel });
        assert.deepEqual(await sairDaConta(createRequestClient(jar)), { success: true });
        assert.equal(await obterIdentidade(createRequestClient(jar)), null);
      } finally {
        await admin.auth.admin.deleteUser(id);
      }
    });
  }
});

test("sair encerra somente a sessão atual e impede renovar seu acesso aos dados", async (t) => {
  const admin = localAdmin();
  const signup = uniqueSignup();
  const created = await admin.auth.admin.createUser({ email: signup.email, password: signup.password, email_confirm: true, user_metadata: signup.options.data });
  assert.equal(created.error, null);
  assert.ok(created.data.user);
  const jar = cookieJar();
  const independentJar = cookieJar();
  const client = createRequestClient(jar);
  const independent = createRequestClient(independentJar);
  const login = new FormData();
  login.set("email", signup.email);
  login.set("senha", signup.password);
  try {
    assert.deepEqual(await entrarNaConta(client, login), { success: true });
    assert.deepEqual(await entrarNaConta(independent, login), { success: true });
    const session = (await client.auth.getSession()).data.session;
    assert.ok(session);
    const expiredJar = cookieJar();
    expiredJar.setAll(jar.getAll());
    assert.equal((await listarSolicitacoes(createRequestClient(jar))).erro, null);
    assert.deepEqual(await sairDaConta(client), { success: true });
    assert.equal(await obterIdentidade(createRequestClient(jar)), null);
    assert.deepEqual(await listarSolicitacoes(createRequestClient(jar)), { data: null, erro: "nao_autenticado" });
    const revoked = await createRequestClient(cookieJar()).auth.refreshSession({ refresh_token: session.refresh_token });
    assert.ok(revoked.error);
    assert.equal(revoked.data.session, null);
    // O tempo avança apenas no cliente; o Auth real já revogou o refresh token.
    t.mock.timers.enable({ apis: ["Date"], now: Date.now() + 2 * 60 * 60 * 1000 });
    try {
      assert.equal(await obterIdentidade(createRequestClient(expiredJar)), null);
      assert.deepEqual(await listarSolicitacoes(createRequestClient(expiredJar)), { data: null, erro: "nao_autenticado" });
    } finally { t.mock.timers.reset(); }
    assert.equal((await independent.auth.refreshSession()).error, null);
    assert.deepEqual(await obterIdentidade(createRequestClient(independentJar)), { id: created.data.user.id, papel: "Cliente" });
  } finally {
    await independent.auth.signOut({ scope: "local" });
    await admin.auth.admin.deleteUser(created.data.user.id);
  }
});

test("login sem perfil protegido recusa a sessão criada pelo Auth", async () => {
  const admin = localAdmin();
  const signup = uniqueSignup();
  const created = await admin.auth.admin.createUser({ email: signup.email, password: signup.password, email_confirm: true, user_metadata: signup.options.data });
  assert.equal(created.error, null);
  assert.ok(created.data.user);
  const jar = cookieJar();
  try {
    assert.equal((await admin.from("perfis").delete().eq("id", created.data.user.id)).error, null);
    const login = new FormData();
    login.set("email", signup.email);
    login.set("senha", signup.password);
    const result = await entrarNaConta(createRequestClient(jar), login);
    assert.equal(result.message, "Não foi possível verificar seu perfil. Tente novamente.");
    assert.ok(!result.success);
    assert.doesNotMatch(JSON.stringify(result), /Teste-local-123!/);
    assert.equal((await createRequestClient(jar).auth.getSession()).data.session, null);
    assert.equal(await obterIdentidade(createRequestClient(jar)), null);
  } finally { await admin.auth.admin.deleteUser(created.data.user.id); }
});

test("cadastro da aplicação valida campos e setor antes de criar uma conta", async () => {
  const client = createRequestClient(cookieJar());
  const invalid = new FormData();
  invalid.set("nome", " \ufeff ");
  invalid.set("email", "email-invalido");
  invalid.set("senha", "1234567");
  invalid.set("matricula", " ");
  invalid.set("setor_id", "invalido");
  const result = await cadastrarCliente(client, invalid);
  assert.deepEqual(Object.keys(result.errors ?? {}).sort(), ["email", "matricula", "nome", "senha", "setor_id"]);
  assert.ok(!JSON.stringify(result).includes("1234567"));
  const signup = uniqueSignup();
  const form = signupForm(signup);
  form.set("setor_id", "99999999-9999-4999-8999-999999999999");
  assert.equal((await cadastrarCliente(client, form)).errors?.setor_id, "Selecione um setor válido.");
  assert.equal(await obterIdentidade(client), null);
});

function signupForm(signup: ReturnType<typeof uniqueSignup>) {
  const form = new FormData();
  form.set("email", signup.email);
  form.set("senha", signup.password);
  for (const [name, value] of Object.entries(signup.options.data)) form.set(name, value);
  return form;
}

test("cadastro → login → logout usa Auth real e informa duplicatas sem devolver senha", async () => {
  const admin = localAdmin();
  const jar = cookieJar();
  const client = createRequestClient(jar);
  const signup = uniqueSignup();
  const form = signupForm(signup);
  assert.deepEqual(await cadastrarCliente(client, form), { success: true });
  assert.equal(await obterIdentidade(createRequestClient(jar)), null);
  const login = new FormData();
  login.set("email", signup.email);
  login.set("senha", signup.password);
  assert.deepEqual(await entrarNaConta(client, login), { success: true });
  const identity = await obterIdentidade(createRequestClient(jar));
  assert.ok(identity);
  try {
    assert.equal(identity.papel, "Cliente");
    const profile = await client.from("perfis").select("nome,matricula,setor_id").single();
    assert.equal(profile.error, null);
    assert.equal(profile.data.matricula, signup.options.data.matricula.trim());
    assert.equal(profile.data.nome, signup.options.data.nome);
    assert.equal(profile.data.setor_id, signup.options.data.setor_id);
    const duplicate = uniqueSignup();
    duplicate.options.data.matricula = signup.options.data.matricula.trim().toLowerCase();
    for (const input of [form, signupForm(duplicate)]) {
      const result = await cadastrarCliente(createRequestClient(cookieJar()), input);
      assert.match(result.message ?? "", /e-mail e matrícula devem ser únicos/);
      assert.ok(!JSON.stringify(result).includes(signup.password));
      assert.equal(result.values?.nome, input.get("nome"));
    }
    await client.auth.signOut({ scope: "local" });
    assert.equal(await obterIdentidade(createRequestClient(jar)), null);
    login.set("senha", "senha-incorreta");
    const invalid = await entrarNaConta(createRequestClient(jar), login);
    assert.equal(invalid.message, "E-mail ou senha inválidos.");
    assert.equal(invalid.values?.email, signup.email);
    assert.equal(await obterIdentidade(createRequestClient(jar)), null);
  } finally {
    await client.auth.signOut({ scope: "local" });
    await admin.auth.admin.deleteUser(identity.id);
  }
});
