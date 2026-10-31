import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequestClient, obterIdentidade } from "../src/server/identity.ts";
import { localAdmin, cookieJar, uniqueSignup } from "./support/identity.ts";

test("cadastro real cria Cliente sem matrícula/setor e recupera identidade por cookies", async () => {
  const admin = localAdmin();
  const jar = cookieJar();
  const client = createRequestClient(jar);
  const input = uniqueSignup();
  const { data, error } = await client.auth.signUp(input);
  assert.equal(error, null); assert.ok(data.user);
  try {
    assert.deepEqual(await obterIdentidade(createRequestClient(jar)), { id: data.user.id, papel: "Cliente" });
    const profile = await admin.from("perfis").select("id,nome,papel,matricula,setor_id,excluido_em").eq("id", data.user.id).single();
    assert.equal(profile.error, null);
    assert.deepEqual(profile.data, { id: data.user.id, nome: "Cliente fictício", papel: "Cliente", matricula: null, setor_id: null, excluido_em: null });
  } finally { await admin.auth.admin.deleteUser(data.user.id); }
});

test("Auth e RLS recusam perfis inválidos, duplicatas e alterações posteriores de papel", async () => {
  const admin = localAdmin();
  const jar = cookieJar();
  const client = createRequestClient(jar);
  const signup = uniqueSignup();
  const first = await client.auth.signUp(signup);
  assert.equal(first.error, null); assert.ok(first.data.user);
  try {
    const duplicate = await createRequestClient(cookieJar()).auth.signUp(signup);
    assert.ok(duplicate.error);
    assert.ok((await client.auth.signInWithPassword({ email: signup.email, password: "incorreta" })).error);
    for (const name of ["nome"]) {
      const invalid = uniqueSignup(); Reflect.deleteProperty(invalid.options.data, name);
      assert.ok((await createRequestClient(cookieJar()).auth.signUp(invalid)).error);
    }
    assert.ok((await client.auth.signUp({ ...uniqueSignup(), password: "1234567" })).error);
    assert.ok((await client.auth.signUp({ ...uniqueSignup(), email: "" })).error);
    const blank = uniqueSignup(); blank.options.data.nome = "   ";
    assert.ok((await createRequestClient(cookieJar()).auth.signUp(blank)).error);
    assert.ok((await client.from("perfis").update({ papel: "Gestor" }).eq("id", first.data.user.id)).error);
    assert.ok((await client.from("perfis").update({ excluido_em: new Date().toISOString() }).eq("id", first.data.user.id)).error);
    assert.equal((await client.auth.updateUser({ data: { papel: "Gestor", role: "service_role" } })).error, null);
    assert.deepEqual(await obterIdentidade(client), { id: first.data.user.id, papel: "Cliente" });
    const anon = createRequestClient(cookieJar());
    assert.equal(await obterIdentidade(anon), null);
    assert.ok((await anon.from("perfis").select("*")).error);
  } finally { await admin.auth.admin.deleteUser(first.data.user.id); }
});

test("cada sessão vê somente o próprio perfil", async () => {
  const admin = localAdmin();
  const first = createRequestClient(cookieJar()), second = createRequestClient(cookieJar());
  const a = await first.auth.signUp(uniqueSignup()), b = await second.auth.signUp(uniqueSignup());
  assert.equal(a.error, null); assert.equal(b.error, null); assert.ok(a.data.user); assert.ok(b.data.user);
  try {
    assert.deepEqual((await first.from("perfis").select("id")).data, [{ id: a.data.user.id }]);
    assert.deepEqual((await first.from("perfis").select("id").eq("id", b.data.user.id)).data, []);
    assert.deepEqual(await obterIdentidade(second), { id: b.data.user.id, papel: "Cliente" });
  } finally { await admin.auth.admin.deleteUser(a.data.user.id); await admin.auth.admin.deleteUser(b.data.user.id); }
});

test("nome mantém validação textual e trim JavaScript no cadastro direto", async () => {
  const admin = localAdmin();
  const whitespace = "\u0009\u000a\u000b\u000c\u000d\u0020\u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\ufeff";
  for (const nome of [whitespace, "\ufeff", 123, true, [], {}]) {
    const signup = uniqueSignup();
    const result = await createRequestClient(cookieJar()).auth.signUp({ ...signup, options: { data: { nome } } });
    try { assert.ok(result.error, JSON.stringify(nome)); }
    finally { if (result.data.user) await admin.auth.admin.deleteUser(result.data.user.id); }
  }
  const signup = uniqueSignup();
  const client = createRequestClient(cookieJar());
  const result = await client.auth.signUp({ ...signup, options: { data: { nome: `${whitespace}Pessoa${whitespace}` } } });
  assert.equal(result.error, null); assert.ok(result.data.user);
  try { assert.equal((await client.from("perfis").select("nome").single()).data?.nome, "Pessoa"); }
  finally { await admin.auth.admin.deleteUser(result.data.user.id); }
});
