import assert from "node:assert/strict";
import { test } from "node:test";
import { createClient } from "@supabase/supabase-js";
import { entrarNaConta } from "../src/server/account.ts";

test("login orienta aguardar quando o Auth limita tentativas, preservando e-mail sem devolver senha", async () => {
  const client = createClient("http://127.0.0.1:54321", "sb_publishable_teste", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async () => new Response(JSON.stringify({
      code: "over_request_rate_limit", message: "Too many requests",
    }), { status: 429, headers: { "Content-Type": "application/json" } }) },
  });
  const form = new FormData();
  form.set("email", "cliente@example.test");
  form.set("senha", "Senha-ficticia-123!");

  const result = await entrarNaConta(client, form);

  assert.equal(result.message, "Muitas tentativas. Aguarde um pouco antes de tentar novamente.");
  assert.equal(result.values?.email, "cliente@example.test");
  assert.ok(!result.success);
  assert.doesNotMatch(JSON.stringify(result), /Senha-ficticia-123!/);
});
