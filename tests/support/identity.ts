import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

export function localAdmin() {
  if (process.env.SUPABASE_TARGET !== "local" || process.env.SUPABASE_URL !== "http://127.0.0.1:54321") {
    throw new Error("Integração destrutiva permitida somente no Supabase local descartável.");
  }
  let output: string;
  try {
    output = execFileSync("npx", ["--no-install", "supabase", "status", "--output", "json"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    // Sessão Linux aberta antes da atribuição do grupo Docker.
    output = execFileSync("sg", ["docker", "-c", "npx --no-install supabase status --output json"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  }
  const status = JSON.parse(output);
  return createClient(process.env.SUPABASE_URL, status.SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function cookieJar() {
  const values = new Map<string, string>();
  return {
    getAll: () => [...values].map(([name, value]) => ({ name, value })),
    setAll: (cookies: { name: string; value: string }[]) => { for (const { name, value } of cookies) values.set(name, value); },
  };
}

export function uniqueSignup() {
  const id = randomUUID();
  return {
    email: `identity-${id}@example.test`, password: "Teste-local-123!",
    options: { data: { nome: "Cliente fictício", matricula: `  00Ab-${id}  `, setor_id: "10000000-0000-4000-8000-000000000001", papel: "Gestor" } },
  };
}
