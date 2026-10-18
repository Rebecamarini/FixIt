import assert from "node:assert/strict";
import { test } from "node:test";
import { checkConnection } from "../src/server/connection.ts";

test("configuração ausente orienta a preparação sem revelar valores", async () => {
  const result = await checkConnection({});
  assert.equal(result.status, "configuration-error");
  assert.match(result.message, /\.env\.local/);
});

test("falha de conexão ou chave recusada gera orientação sem revelar a chave", async () => {
  const result = await checkConnection({
    SUPABASE_TARGET: "local", SUPABASE_URL: "http://127.0.0.1:54321",
    SUPABASE_PUBLISHABLE_KEY: "sb_publishable_chaveInvalidaParaTeste",
  });
  assert.equal(result.status, "unavailable");
  assert.match(result.message, /supabase:start/);
  assert.doesNotMatch(result.message, /chaveInvalidaParaTeste/);
});

test("recusa destino inválido e não devolve configuração sensível", async () => {
  const result = await checkConnection({
    SUPABASE_TARGET: "local", SUPABASE_URL: "https://usuario:senha-privada@example.com/",
    SUPABASE_PUBLISHABLE_KEY: "sb_secret_nao-expor",
  });
  assert.equal(result.status, "configuration-error");
  assert.doesNotMatch(JSON.stringify(result), /senha-privada|sb_secret|example\.com/);
});

test("distingue configuração incompleta de chave administrativa e URL inválida", async () => {
  for (const key of ["", "sb_secret_privada", "chave-malformada", `a.${Buffer.from('{"role":"service_role"}').toString("base64url")}.c`]) {
    const result = await checkConnection({ SUPABASE_TARGET: "local", SUPABASE_URL: "http://127.0.0.1:54321", SUPABASE_PUBLISHABLE_KEY: key });
    assert.equal(result.status, "configuration-error");
    assert.doesNotMatch(result.message, /sb_secret_privada|chave-malformada|service_role/);
  }
  for (const url of ["inválida", "http://127.0.0.1:54321/rest/v1", "http://127.0.0.1:54321?key=privada", "https://example.com", "http://127.0.0.1:9999"]) {
    assert.equal((await checkConnection({ SUPABASE_TARGET: "local", SUPABASE_URL: url, SUPABASE_PUBLISHABLE_KEY: "sb_publishable_teste" })).status, "configuration-error");
  }
});

test("exige seleção explícita e rejeita destino incompatível", async () => {
  for (const env of [
    { SUPABASE_URL: "http://127.0.0.1:54321", SUPABASE_PUBLISHABLE_KEY: "sb_publishable_teste" },
    { SUPABASE_TARGET: "cloud", SUPABASE_URL: "http://127.0.0.1:54321", SUPABASE_PUBLISHABLE_KEY: "sb_publishable_teste" },
    { SUPABASE_TARGET: "local", SUPABASE_URL: "https://gifqssocvuieagmndxwy.supabase.co", SUPABASE_PUBLISHABLE_KEY: "sb_publishable_teste" },
  ]) assert.equal((await checkConnection(env)).status, "configuration-error");
});
