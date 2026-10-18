import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "../src/server/config.ts";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const config = getSupabaseConfig();
let adminKey = process.env.SUPABASE_SECRET_KEY;
if (config.target === "local" && !adminKey) {
  const status = JSON.parse(execFileSync("npx", ["--no-install", "supabase", "status", "--output", "json"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }));
  adminKey = status.SERVICE_ROLE_KEY;
}
if (!adminKey) throw new Error("Defina SUPABASE_SECRET_KEY somente no ambiente administrativo.");
if (config.target === "cloud" && process.env.FIXIT_PREPARE_CLOUD !== "confirmar-dados-ficticios") {
  throw new Error("Confirme explicitamente FIXIT_PREPARE_CLOUD=confirmar-dados-ficticios para preparar o cloud selecionado.");
}
const password = process.env.FIXIT_TEST_PASSWORD ?? (config.target === "local" ? "Fixit-ficticio-123!" : "");
if (password.length < 8) throw new Error("Defina FIXIT_TEST_PASSWORD com pelo menos oito caracteres.");
const admin = createClient(config.url, adminKey, { auth: { persistSession: false, autoRefreshToken: false } });
const fixtures = [
  { email: "cliente1@fixit.example", nome: "Cliente Um (fictício)", matricula: "0001", papel: "Cliente" },
  { email: "cliente2@fixit.example", nome: "Cliente Dois (fictício)", matricula: "0002", papel: "Cliente" },
  { email: "manutentor@fixit.example", nome: "Manutentor (fictício)", matricula: "0003", papel: "Manutentor" },
  { email: "gestor@fixit.example", nome: "Gestor (fictício)", matricula: "0004", papel: "Gestor" },
];
const users = [];
for (let page = 1; ; page++) {
  const result = await admin.auth.admin.listUsers({ page, perPage: 100 });
  if (result.error) throw new Error("Não foi possível consultar as contas administrativas.");
  users.push(...result.data.users);
  if (result.data.users.length < 100) break;
}
for (const fixture of fixtures) {
  const setor_id = "10000000-0000-4000-8000-000000000001";
  const existing = users.find((user) => user.email?.toLowerCase() === fixture.email);
  let id = existing?.id;
  if (existing) {
    const profile = await admin.from("perfis").select("nome,matricula,setor_id,papel").eq("id", existing.id).single();
    if (existing.app_metadata.fixit_fixture !== "spec001" || profile.error ||
      profile.data.nome !== fixture.nome || profile.data.matricula !== fixture.matricula || profile.data.setor_id !== setor_id || profile.data.papel !== fixture.papel) {
      throw new Error(`Colisão em ${fixture.email}: conta preservada; revise administrativamente.`);
    }
  } else {
    const created = await admin.auth.admin.createUser({
      email: fixture.email, password, email_confirm: true,
      user_metadata: { nome: fixture.nome, matricula: fixture.matricula, setor_id },
      app_metadata: { fixit_fixture: "spec001" },
    });
    if (created.error) throw new Error(`Falha ao preparar ${fixture.email}; nenhum usuário existente foi alterado.`);
    id = created.data.user.id;
    const changed = await admin.from("perfis").update({ papel: fixture.papel }).eq("id", id);
    if (changed.error) {
      await admin.auth.admin.deleteUser(id);
      throw new Error(`Falha ao atribuir papel administrativo a ${fixture.email}.`);
    }
  }
  // Verifica senha sem regravá-la: reruns nunca trocam credenciais existentes.
  const client = createClient(config.url, config.publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const signed = await client.auth.signInWithPassword({ email: fixture.email, password });
  if (signed.error || signed.data.user.id !== id) throw new Error(`Conta ${fixture.email} preservada, mas a senha fornecida não autentica.`);
  await client.auth.signOut();
  console.log(`Conta fictícia verificada: ${fixture.email} (${fixture.papel}).`);
}
