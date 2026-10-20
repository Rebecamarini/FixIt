import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequestClient } from "../src/server/identity.ts";
import { criarSolicitacao, listarSolicitacoes, obterSolicitacao, obterHistoricoSolicitacao } from "../src/server/requests.ts";
import { localAdmin, cookieJar, uniqueSignup } from "./support/identity.ts";

const valid = { local: "Sala 12", categoria_id: "20000000-0000-4000-8000-000000000001", assunto: "Consulta", descricao: "Lâmpada apagada." };

test("consulta paginada retorna somente resumos próprios, vinte por página, mais recentes primeiro e vazio", async () => {
  const admin = localAdmin();
  const owner = createRequestClient(cookieJar());
  const other = createRequestClient(cookieJar());
  const a = await owner.auth.signUp(uniqueSignup());
  const b = await other.auth.signUp(uniqueSignup());
  assert.equal(a.error, null); assert.equal(b.error, null);
  assert.ok(a.data.user); assert.ok(b.data.user);
  try {
    assert.deepEqual(await listarSolicitacoes(other), { data: { itens: [], pagina: 1, tamanho_pagina: 20, total: 0 }, erro: null });
    const ids: string[] = [];
    let newestDate = "";
    for (let i = 1; i <= 21; i++) {
      const created = await criarSolicitacao(owner, { ...valid, assunto: `Consulta ${i}` });
      assert.ok(created.data); ids.push(created.data.id); newestDate = created.data.criado_em;
    }
    const foreign = await criarSolicitacao(other, { ...valid, assunto: "Alheia" });
    assert.ok(foreign.data);
    const first = await listarSolicitacoes(owner);
    assert.equal(first.erro, null); assert.ok(first.data);
    assert.equal(first.data.total, 21); assert.equal(first.data.itens.length, 20);
    assert.deepEqual(first.data.itens.map(row => row.id), ids.toReversed().slice(0, 20));
    assert.deepEqual(first.data.itens[0], { id: ids[20], assunto: "Consulta 21", categoria_id: valid.categoria_id, criado_em: newestDate, estado: "Pendente" });
    const second = await listarSolicitacoes(owner, 2);
    assert.deepEqual(second.data?.itens.map(row => row.id), [ids[0]]);
    assert.deepEqual((await listarSolicitacoes(owner, 3)).data, { itens: [], pagina: 3, tamanho_pagina: 20, total: 21 });
    // Mesmo instante no banco: UUID maior deve aparecer primeiro, inclusive entre páginas.
    assert.equal((await admin.from("solicitacoes").update({ criado_em: "2000-01-01T00:00:00Z" }).eq("autor_id", a.data.user.id)).error, null);
    const tiedFirst = await listarSolicitacoes(owner);
    const tiedSecond = await listarSolicitacoes(owner, 2);
    const ordered = [...tiedFirst.data!.itens, ...tiedSecond.data!.itens].map(row => row.id);
    assert.equal(new Set(ordered).size, 21);
    for (let i = 1; i < ordered.length; i++) assert.ok(ordered[i - 1] > ordered[i], "UUID decrescente no empate");
    assert.deepEqual(await listarSolicitacoes(owner), tiedFirst);
    for (const page of [0, -1, 1.5, "2", null, Number.MAX_SAFE_INTEGER]) {
      assert.deepEqual(await listarSolicitacoes(owner, page), { data: null, erro: "dados_invalidos" });
    }
  } finally {
    for (const user of [a.data.user, b.data.user]) {
      await admin.from("solicitacoes").delete().eq("autor_id", user.id);
      await admin.auth.admin.deleteUser(user.id);
    }
  }
});


test("detalhe e histórico preservam isolamento, mesma ausência e cronologia com desempate", async () => {
  const admin = localAdmin();
  const owner = createRequestClient(cookieJar());
  const other = createRequestClient(cookieJar());
  const anon = createRequestClient(cookieJar());
  const a = await owner.auth.signUp(uniqueSignup());
  const b = await other.auth.signUp(uniqueSignup());
  assert.ok(a.data.user); assert.ok(b.data.user);
  try {
    const created = await criarSolicitacao(owner, valid);
    assert.ok(created.data);
    const id = created.data.id;
    assert.deepEqual(await obterSolicitacao(owner, id), { data: created.data, erro: null });
    const initial = await obterHistoricoSolicitacao(owner, id);
    assert.equal(initial.erro, null); assert.equal(initial.data?.length, 1);
    assert.equal(initial.data[0].descricao, "Solicitação criada.");
    assert.equal(initial.data[0].estado_anterior, null);
    assert.equal(initial.data[0].criado_em, created.data.criado_em);
    // Dados locais sintéticos verificam a leitura cronológica sem liberar escrita ao Cliente.
    const ids = ["11111111-1111-4111-8111-111111111111", "22222222-2222-4222-8222-222222222222", "33333333-3333-4333-8333-333333333333"];
    assert.equal((await admin.from("historico_solicitacoes").update({ criado_em: "2000-01-01T00:00:00Z" }).eq("solicitacao_id", id)).error, null);
    assert.equal((await admin.from("historico_solicitacoes").insert([
      { id: ids[2], criado_em: "2002-01-01T00:00:00Z" },
      { id: ids[1], criado_em: "2001-01-01T00:00:00Z" },
      { id: ids[0], criado_em: "2001-01-01T00:00:00Z" },
    ].map(row => ({ ...row, solicitacao_id: id, autor_id: a.data.user!.id, descricao: "Exemplo cronológico local", estado_anterior: "Pendente", estado_novo: "Pendente" })))).error, null);
    assert.deepEqual((await obterHistoricoSolicitacao(owner, id)).data?.map(row => row.id), [initial.data[0].id, ...ids]);
    const missing = "99999999-9999-4999-8999-999999999999";
    for (const query of [obterSolicitacao, obterHistoricoSolicitacao]) {
      assert.deepEqual(await query(other, id), { data: null, erro: "nao_encontrado" });
      assert.deepEqual(await query(other, missing), { data: null, erro: "nao_encontrado" });
      assert.deepEqual(await query(anon, id), { data: null, erro: "nao_autenticado" });
      assert.deepEqual(await query(owner, "inválido"), { data: null, erro: "dados_invalidos" });
    }
    assert.deepEqual(await listarSolicitacoes(anon), { data: null, erro: "nao_autenticado" });
    for (const table of ["solicitacoes", "historico_solicitacoes"]) {
      const column = table === "solicitacoes" ? "id" : "solicitacao_id";
      const foreign = await other.from(table).select("*").eq(column, id);
      assert.equal(foreign.error, null); assert.deepEqual(foreign.data, []);
      assert.ok((await anon.from(table).select("*").eq(column, id)).error);
      assert.ok((await owner.from(table).delete().eq(column, id)).error);
      assert.ok((await owner.from(table).update(table === "solicitacoes" ? { assunto: "Forjado" } : { descricao: "Forjado" }).eq(column, id)).error);
    }
    assert.ok((await owner.from("historico_solicitacoes").insert({ solicitacao_id: id, autor_id: a.data.user.id, descricao: "Forjado", estado_novo: "Pendente" })).error);
    for (const papel of ["Gestor", "Manutentor"]) {
      assert.equal((await admin.from("perfis").update({ papel }).eq("id", b.data.user.id)).error, null);
      assert.deepEqual(await listarSolicitacoes(other), { data: null, erro: "nao_autorizado" });
      assert.deepEqual(await obterSolicitacao(other, id), { data: null, erro: "nao_autorizado" });
      assert.deepEqual(await obterHistoricoSolicitacao(other, id), { data: null, erro: "nao_autorizado" });
    }
  } finally {
    for (const user of [a.data.user, b.data.user]) {
      await admin.from("solicitacoes").delete().eq("autor_id", user.id);
      await admin.auth.admin.deleteUser(user.id);
    }
  }
});

test("preparação repetida preserva contas, exemplos, eventos e solicitações adicionais", async () => {
  const admin = localAdmin();
  const { execFileSync } = await import("node:child_process");
  const prepare = () => execFileSync(process.execPath, ["--conditions=react-server", "scripts/prepare-test-data.ts"], { stdio: ["ignore", "pipe", "pipe"] });
  prepare();
  const snapshot = async () => {
    const rows = [];
    for (const email of ["cliente1@fixit.example", "cliente2@fixit.example", "manutentor@fixit.example", "gestor@fixit.example"]) {
      const client = createRequestClient(cookieJar());
      const login = await client.auth.signInWithPassword({ email, password: process.env.FIXIT_TEST_PASSWORD ?? "Fixit-ficticio-123!" });
      assert.equal(login.error, null); assert.ok(login.data.user);
      const requests = await client.from("solicitacoes").select("*").order("id");
      const history = await client.from("historico_solicitacoes").select("*").order("id");
      assert.equal(requests.error, null); assert.equal(history.error, null);
      if (email.startsWith("cliente")) {
        assert.equal(requests.data.filter(row => row.assunto.startsWith("SPEC-001 exemplo ")).length, 21);
        assert.ok(history.data.length >= 21);
      }
      rows.push({ email, id: login.data.user.id, requests: requests.data, history: history.data });
      await client.auth.signOut();
    }
    return rows;
  };
  const owner = createRequestClient(cookieJar());
  assert.equal((await owner.auth.signInWithPassword({ email: "cliente1@fixit.example", password: process.env.FIXIT_TEST_PASSWORD ?? "Fixit-ficticio-123!" })).error, null);
  const extra = await criarSolicitacao(owner, { ...valid, assunto: "Solicitação adicional preservada no rerun" });
  assert.ok(extra.data);
  try {
    const before = await snapshot();
    prepare();
    assert.deepEqual(await snapshot(), before);
  } finally {
    await admin.from("solicitacoes").delete().eq("id", extra.data.id);
    await owner.auth.signOut();
  }
});
