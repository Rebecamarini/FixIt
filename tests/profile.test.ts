import assert from "node:assert/strict";
import { test } from "node:test";
import { createClient } from "@supabase/supabase-js";
import { alterarEmail, alterarSenha, consultarPerfil, encerrarOutrasSessoes, profileErrorMessage, salvarPerfil } from "../src/server/profile.ts";

const wait = "Muitas tentativas. Aguarde um pouco antes de tentar novamente.";

function limitedClient(status = 429) {
  const requests: string[] = [];
  const client = createClient("http://127.0.0.1:54321", "sb_publishable_teste", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: { Authorization: "Bearer controlled-test-token" },
      fetch: async (input, init) => {
        const url = input instanceof Request ? input.url : String(input);
        requests.push(url);
        assert.equal(new URL(url).pathname, "/auth/v1/user");
        assert.equal(init?.method, "GET");
        return new Response(JSON.stringify({ code: "over_request_rate_limit", message: "internal SQL stack secret" }), {
          status, headers: { "Content-Type": "application/json" },
        });
      },
    },
  });
  return { client, requests };
}

test("consulta do perfil preserva orientação sanitizada de aguardar em HTTP 429", async () => {
  const { client, requests } = limitedClient();
  await assert.rejects(consultarPerfil(client), (error: unknown) => {
    assert.equal(profileErrorMessage(error, "Falha ao carregar perfil."), wait);
    assert.equal(error instanceof Error && error.message, wait);
    return true;
  });
  assert.equal(requests.length, 1);
});

test("consulta mantém sessão perdida e indisponibilidade distintas do limite de tentativas", async () => {
  assert.equal(await consultarPerfil(limitedClient(401).client), null);
  await assert.rejects(consultarPerfil(limitedClient(502).client), { message: "Não foi possível acessar o FixIt. Tente novamente em instantes." });
  const fallback = "Falha ao carregar perfil.";
  assert.equal(profileErrorMessage(new Error("internal SQL stack secret"), fallback), fallback);
  assert.equal(profileErrorMessage({ status: 429, message: "internal" }, fallback), fallback);
});

test("salvamentos aguardam HTTP 429 da consulta sem gravar ou perder a sessão", async () => {
  const data = new FormData();
  data.set("nome", "Nome preservado");
  data.set("email", "novo@example.test");
  data.set("senha_atual", "Senha-atual-secreta!");
  data.set("nova_senha", "Senha-nova-secreta!");
  data.set("confirmar_senha", "Senha-nova-secreta!");
  for (const action of [salvarPerfil, alterarEmail, alterarSenha]) {
    const { client, requests } = limitedClient();
    const result = await action(client, data);
    assert.equal(result.message, wait, action.name);
    assert.ok(!result.success);
    assert.ok(!result.sessionLost);
    assert.ok(!result.partial);
    assert.doesNotMatch(JSON.stringify(result), /secreta|internal|SQL|stack/);
    assert.equal(requests.length, 1);
  }
  assert.equal(data.get("nome"), "Nome preservado");
  assert.equal(data.get("email"), "novo@example.test");
});

test("encerramento pendente orienta aguardar HTTP 429 da consulta sem revogar sessões", async () => {
  const { client, requests } = limitedClient();
  const result = await encerrarOutrasSessoes(client);
  assert.equal(result.partial, true);
  assert.ok(!result.success);
  assert.ok(!result.sessionLost);
  assert.equal(result.message, `${wait} Tente novamente somente o encerramento das outras sessões.`);
  assert.equal(requests.length, 1);
});
