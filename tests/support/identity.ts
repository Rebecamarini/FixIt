import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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
  const admin = createClient(process.env.SUPABASE_URL, status.SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const deleteAuthUser = admin.auth.admin.deleteUser.bind(admin.auth.admin);
  admin.auth.admin.deleteUser = async (id, shouldSoftDelete) => {
    const result = await deleteAuthUser(id, shouldSoftDelete);
    // Test fixtures are discarded, unlike product deletions which retain identity and audit.
    if (!result.error || result.error.status === 404) {
      const cleanup = await admin.from("perfis").delete().eq("id", id);
      if (cleanup.error?.code === "23503") await admin.from("perfis").update({ excluido_em: new Date().toISOString() }).eq("id", id).is("excluido_em", null);
    }
    return result;
  };
  return admin;
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
    options: { data: { nome: "Cliente fictício", papel: "Gestor" } },
  };
}

export async function createRoleUser(admin: SupabaseClient, signup: ReturnType<typeof uniqueSignup>, papel: string) {
  const id = randomUUID();
  const reserved = await admin.from("perfis").insert({ id, nome: signup.options.data.nome.trim(), papel, provisionamento_pendente: true });
  if (reserved.error) throw reserved.error;
  const created = await admin.auth.admin.createUser({ id, email: signup.email, password: signup.password, email_confirm: true, user_metadata: signup.options.data });
  if (created.error) { await admin.from("perfis").delete().eq("id", id); throw created.error; }
  const activated = await admin.from("perfis").update({ provisionamento_pendente: false }).eq("id", id);
  if (activated.error) throw activated.error;
  return created;
}
