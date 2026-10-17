import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";
import { checkConnection } from "../src/server/connection.ts";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

test("Auth e API do PostgreSQL reais respondem usando a chave local", async () => {
  const result = await checkConnection();
  assert.equal(result.status, "connected", result.message);
});
