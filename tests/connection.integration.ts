import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";
import { checkConnection } from "../src/server/connection.ts";

if (!process.env.SUPABASE_TARGET && existsSync(".env.local")) process.loadEnvFile(".env.local");

test("Auth, API do PostgreSQL e Storage reais respondem usando a chave pública do destino selecionado", async () => {
  const result = await checkConnection();
  assert.equal(result.status, "connected", result.message);
});

test("o destino real recusa uma chave pública inválida", async () => {
  const result = await checkConnection({ ...process.env, SUPABASE_PUBLISHABLE_KEY: "sb_publishable_invalidaParaTeste" });
  assert.equal(result.status, "unavailable");
});

test("Auth real permite e-mail/senha sem confirmação de e-mail", async () => {
  const response = await fetch(new URL("/auth/v1/settings", process.env.SUPABASE_URL), {
    headers: { apikey: process.env.SUPABASE_PUBLISHABLE_KEY! },
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(response.status, 200);
  const settings = await response.json();
  assert.equal(settings.external.email, true);
  assert.equal(settings.mailer_autoconfirm, true);
});
