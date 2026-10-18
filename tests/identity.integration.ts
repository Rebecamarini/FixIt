import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequestClient, obterIdentidade } from "../src/server/identity.ts";
import { localAdmin, cookieJar, uniqueSignup } from "./support/identity.ts";

test("cadastro real cria Cliente, normaliza matrícula e recupera identidade por cookies", async () => {
  const admin = localAdmin();
  const jar = cookieJar();
  const client = createRequestClient(jar);
  const input = uniqueSignup();
  input.options.data.matricula = `\t${input.options.data.matricula}\n`;
  const { data, error } = await client.auth.signUp(input);
  assert.equal(error, null);
  assert.ok(data.user);
  try {
    assert.ok(jar.getAll().length);
    const reconstructed = createRequestClient(jar);
    assert.deepEqual(await obterIdentidade(reconstructed), { id: data.user.id, papel: "Cliente" });
    const profile = await reconstructed.from("perfis").select("*").single();
    assert.equal(profile.error, null);
    assert.equal(profile.data.matricula, input.options.data.matricula.trim());
    assert.equal(profile.data.id, data.user.id);
  } finally { await admin.auth.admin.deleteUser(data.user.id); }
});

test("Auth e RLS recusam cadastros inválidos, duplicatas e elevação de papel", async () => {
  const admin = localAdmin();
  const client = createRequestClient(cookieJar());
  const signup = uniqueSignup();
  const first = await client.auth.signUp(signup);
  assert.equal(first.error, null);
  assert.ok(first.data.user);
  try {
    const duplicate = uniqueSignup();
    duplicate.options.data.matricula = signup.options.data.matricula.trim().toLowerCase();
    assert.ok((await createRequestClient(cookieJar()).auth.signUp(duplicate)).error);
    assert.ok((await client.auth.signInWithPassword({ email: signup.email, password: "incorreta" })).error);
    for (const field of ["nome", "matricula", "setor_id"]) {
      const input = uniqueSignup();
      Reflect.deleteProperty(input.options.data, field);
      assert.ok((await createRequestClient(cookieJar()).auth.signUp(input)).error, field);
    }
    const missingSector = uniqueSignup();
    missingSector.options.data.setor_id = "99999999-9999-4999-8999-999999999999";
    assert.ok((await client.auth.signUp(missingSector)).error);
    assert.ok((await client.auth.signUp({ ...uniqueSignup(), password: "1234567" })).error);
    assert.ok((await client.auth.signUp({ ...uniqueSignup(), email: "" })).error);
    assert.ok((await client.auth.signUp({ ...uniqueSignup(), email: signup.email })).error);
    const blank = uniqueSignup(); blank.options.data.nome = "   ";
    assert.ok((await client.auth.signUp(blank)).error);
    const whitespace = uniqueSignup(); whitespace.options.data.matricula = "\t\n\r ";
    assert.ok((await client.auth.signUp(whitespace)).error);
    const whitespaceName = uniqueSignup(); whitespaceName.options.data.nome = "\t\n";
    assert.ok((await client.auth.signUp(whitespaceName)).error);
    assert.ok((await client.from("perfis").update({ papel: "Gestor" }).eq("id", first.data.user.id)).error);
    assert.ok((await client.from("perfis").insert({ id: first.data.user.id, papel: "Gestor" })).error);
    assert.equal((await client.auth.updateUser({ data: { papel: "Gestor", role: "service_role" } })).error, null);
    assert.deepEqual(await obterIdentidade(client), { id: first.data.user.id, papel: "Cliente" });
    const anon = createRequestClient(cookieJar());
    assert.equal(await obterIdentidade(anon), null);
    assert.ok((await anon.from("perfis").select("*")).error);
    assert.equal((await anon.from("setores").select("*")).data?.length, 2);
    assert.ok((await client.from("setores").insert({ nome: "Forjado" })).error);
  } finally { await admin.auth.admin.deleteUser(first.data.user.id); }
});

test("cada sessão vê somente o próprio perfil; logout remove a identidade reconstruída", async () => {
  const admin = localAdmin();
  const jar = cookieJar();
  const first = createRequestClient(jar);
  const second = createRequestClient(cookieJar());
  const a = await first.auth.signUp(uniqueSignup());
  const b = await second.auth.signUp(uniqueSignup());
  assert.equal(a.error, null); assert.equal(b.error, null);
  assert.ok(a.data.user); assert.ok(b.data.user);
  try {
    assert.deepEqual((await first.from("perfis").select("id")).data, [{ id: a.data.user.id }]);
    assert.equal((await first.from("perfis").select("id").eq("id", b.data.user.id).maybeSingle()).data, null);
    assert.deepEqual(await obterIdentidade(second), { id: b.data.user.id, papel: "Cliente" });
    await first.auth.signOut();
    assert.equal(await obterIdentidade(createRequestClient(jar)), null);
  } finally {
    await admin.auth.admin.deleteUser(a.data.user.id);
    await admin.auth.admin.deleteUser(b.data.user.id);
  }
});
