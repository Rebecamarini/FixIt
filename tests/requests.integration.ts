import assert from "node:assert/strict";
import { test } from "node:test";
import { execFileSync } from "node:child_process";
import { createRequestClient } from "../src/server/identity.ts";
import { criarSolicitacao } from "../src/server/requests.ts";
import { localAdmin, cookieJar, uniqueSignup } from "./support/identity.ts";

const valid = { local: " Sala 12 ", categoria_id: "20000000-0000-4000-8000-000000000001", assunto: "Lâmpada apagada", descricao: "A lâmpada não acende.", riscos: "\t\n " };

test("Cliente cria solicitação com autoria, data e evento inicial consistentes", async () => {
  const admin = localAdmin();
  const client = createRequestClient(cookieJar());
  const signup = await client.auth.signUp(uniqueSignup());
  assert.equal(signup.error, null); assert.ok(signup.data.user);
  let requestId: string | undefined;
  try {
    const before = Date.now();
    const result = await criarSolicitacao(client, valid);
    assert.equal(result.erro, null); assert.ok(result.data);
    requestId = result.data.id;
    assert.equal(result.data.autor_id, signup.data.user.id);
    assert.equal(result.data.estado, "Pendente");
    assert.equal(result.data.local, "Sala 12");
    assert.equal(result.data.riscos, null);
    assert.ok(Date.parse(result.data.criado_em) >= before - 1000);
    assert.ok(Date.parse(result.data.criado_em) <= Date.now() + 1000);
    const history = await client.from("historico_solicitacoes").select("*").eq("solicitacao_id", requestId);
    assert.equal(history.error, null); assert.equal(history.data?.length, 1);
    assert.equal(history.data[0].autor_id, signup.data.user.id);
    assert.equal(history.data[0].criado_em, result.data.criado_em);
    assert.equal(history.data[0].descricao, "Solicitação criada.");
    assert.equal(history.data[0].estado_novo, "Pendente");
    assert.equal(history.data[0].estado_anterior, null);
  } finally {
    if (requestId) await admin.from("solicitacoes").delete().eq("id", requestId);
    await admin.auth.admin.deleteUser(signup.data.user.id);
  }
});

test("fronteira de criação recusa campos inválidos e API não permite campos protegidos ou eventos fabricados", async () => {
  const admin = localAdmin();
  const client = createRequestClient(cookieJar());
  const signup = await client.auth.signUp(uniqueSignup());
  assert.equal(signup.error, null); assert.ok(signup.data.user);
  try {
    for (const key of ["local", "assunto", "descricao", "categoria_id"]) {
      for (const value of [undefined, null, "", " \t\r\n ", 12, "\u00a0\u2003", "\ufeff"]) {
        assert.equal((await criarSolicitacao(client, { ...valid, [key]: value })).erro, "dados_invalidos", `${key}: ${JSON.stringify(value)}`);
      }
    }
    for (const value of [null, [], "texto", {}, { ...valid, motivo: 12 }, { ...valid, prioridade: "Urgente" }, { ...valid, categoria_id: "não UUID" }, { ...valid, categoria_id: "99999999-9999-4999-8999-999999999999" }]) {
      assert.equal((await criarSolicitacao(client, value)).erro, "dados_invalidos");
    }
    for (const key of ["local", "assunto", "descricao"]) {
      for (const value of [null, "", "\t\n\r ", "\u00a0\u2003", "\ufeff"]) {
        assert.ok((await client.from("solicitacoes").insert({ ...valid, [key]: value })).error, key);
      }
      const missing = { ...valid }; Reflect.deleteProperty(missing, key);
      assert.ok((await client.from("solicitacoes").insert(missing)).error, key);
    }
    assert.ok((await client.from("solicitacoes").insert({ ...valid, categoria_id: "99999999-9999-4999-8999-999999999999" })).error);
    for (const protectedFields of [{ autor_id: signup.data.user.id }, { criado_em: "2000-01-01T00:00:00Z" }, { estado: "Pendente" }, { id: "99999999-9999-4999-8999-999999999999" }, { prioridade: "Urgente" }]) {
      assert.ok((await client.from("solicitacoes").insert({ ...valid, ...protectedFields })).error);
      assert.equal((await criarSolicitacao(client, { ...valid, ...protectedFields })).erro, "dados_invalidos");
    }
    const result = await criarSolicitacao(client, { ...valid, motivo: "  Inspeção  ", frequencia: "Diária", tipo_utilizacao: "Ensino", pessoas_areas_afetadas: "Turma 1", patrimonios_afetados: "Luminária" });
    assert.ok(result.data);
    assert.equal(result.data.motivo, "Inspeção");
    assert.equal(result.data.patrimonios_afetados, "Luminária");
    const fabricated = await client.from("historico_solicitacoes").insert({ solicitacao_id: result.data.id, autor_id: signup.data.user.id, descricao: "Forjado", estado_novo: "Pendente" });
    assert.ok(fabricated.error);
    assert.ok((await client.from("solicitacoes").update({ assunto: "Forjado" }).eq("id", result.data.id)).error);
    assert.ok((await client.from("solicitacoes").delete().eq("id", result.data.id)).error);
    assert.ok((await client.from("historico_solicitacoes").update({ descricao: "Forjado" }).eq("solicitacao_id", result.data.id)).error);
    assert.ok((await client.from("historico_solicitacoes").delete().eq("solicitacao_id", result.data.id)).error);
    assert.ok((await client.from("categorias").insert({ nome: "Forjada" })).error);
    assert.equal((await client.from("categorias").select("id")).data?.length, 2);
    const anon = createRequestClient(cookieJar());
    assert.equal((await criarSolicitacao(anon, valid)).erro, "nao_autenticado");
    assert.ok((await anon.from("solicitacoes").insert(valid)).error);
    assert.ok((await anon.from("solicitacoes").select("*")).error);
    assert.ok((await anon.from("historico_solicitacoes").select("*")).error);
    assert.equal((await client.from("solicitacoes").select("id")).data?.length, 1);
  } finally {
    await admin.from("solicitacoes").delete().eq("autor_id", signup.data.user.id);
    await admin.auth.admin.deleteUser(signup.data.user.id);
  }
});


test("uma falha real no histórico desfaz a criação da solicitação", async () => {
  const admin = localAdmin(); // Guard obrigatório antes de qualquer SQL destrutivo.
  const client = createRequestClient(cookieJar());
  const signup = await client.auth.signUp(uniqueSignup());
  assert.equal(signup.error, null); assert.ok(signup.data.user);
  const sql = (input: string) => execFileSync("sg", ["docker", "-c", "docker exec -i supabase_db_fixit psql -U postgres -d postgres -v ON_ERROR_STOP=1"], { input, stdio: ["pipe", "pipe", "pipe"] });
  const assunto = `Falha atômica ${signup.data.user.id}`;
  try {
    // Falha downstream real: uma constraint temporária recusa o evento deste autor.
    // NOT VALID preserva eventos já existentes; não há failpoint na migration.
    sql(`alter table public.historico_solicitacoes add constraint bt004_history_failure check (autor_id <> '${signup.data.user.id}'::uuid) not valid;`);
    const failed = await criarSolicitacao(client, { ...valid, assunto });
    assert.equal(failed.data, null); assert.ok(failed.erro);
    const requests = await client.from("solicitacoes").select("id").eq("assunto", assunto);
    assert.equal(requests.error, null); assert.deepEqual(requests.data, []);
    const history = await client.from("historico_solicitacoes").select("id");
    assert.equal(history.error, null); assert.deepEqual(history.data, []);
    sql("alter table public.historico_solicitacoes drop constraint bt004_history_failure;");
    const recovered = await criarSolicitacao(client, { ...valid, assunto });
    assert.equal(recovered.erro, null); assert.ok(recovered.data);
    const recoveredHistory = await client.from("historico_solicitacoes").select("id").eq("solicitacao_id", recovered.data.id);
    assert.equal(recoveredHistory.error, null); assert.equal(recoveredHistory.data?.length, 1);
  } finally {
    sql("alter table public.historico_solicitacoes drop constraint if exists bt004_history_failure;");
    await admin.from("solicitacoes").delete().eq("autor_id", signup.data.user.id);
    await admin.auth.admin.deleteUser(signup.data.user.id);
  }
});

test("solicitação e histórico ficam privados e papéis privilegiados não recebem criação antecipada", async () => {
  const admin = localAdmin();
  const owner = createRequestClient(cookieJar());
  const other = createRequestClient(cookieJar());
  const a = await owner.auth.signUp(uniqueSignup());
  const b = await other.auth.signUp(uniqueSignup());
  assert.equal(a.error, null); assert.equal(b.error, null);
  assert.ok(a.data.user); assert.ok(b.data.user);
  let id: string | undefined;
  try {
    const created = await criarSolicitacao(owner, valid);
    assert.ok(created.data); id = created.data.id;
    assert.equal((await other.from("solicitacoes").select("*").eq("id", id).maybeSingle()).data, null);
    assert.deepEqual((await other.from("historico_solicitacoes").select("*").eq("solicitacao_id", id)).data, []);
    assert.ok((await other.from("solicitacoes").insert({ ...valid, autor_id: a.data.user.id })).error);
    for (const papel of ["Gestor", "Manutentor"]) {
      assert.equal((await admin.from("perfis").update({ papel }).eq("id", b.data.user.id)).error, null);
      assert.equal((await criarSolicitacao(other, valid)).erro, "nao_autorizado");
      assert.ok((await other.from("solicitacoes").insert(valid)).error);
      assert.deepEqual((await other.from("solicitacoes").select("*")).data, []);
      assert.deepEqual((await other.from("historico_solicitacoes").select("*")).data, []);
    }
  } finally {
    if (id) await admin.from("solicitacoes").delete().eq("id", id);
    await admin.auth.admin.deleteUser(a.data.user.id);
    await admin.auth.admin.deleteUser(b.data.user.id);
  }
});
