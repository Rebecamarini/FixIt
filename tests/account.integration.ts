import assert from "node:assert/strict";
import { test } from "node:test";
import { cadastrarCliente, entrarNaConta } from "../src/server/account.ts";
import { createRequestClient, obterIdentidade } from "../src/server/identity.ts";
import { localAdmin, cookieJar, uniqueSignup } from "./support/identity.ts";

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
