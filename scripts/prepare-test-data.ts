import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { criarSolicitacao } from "../src/server/requests.ts";
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
  { email: "cliente1@fixit.example", nome: "Cliente Um (fictício)", papel: "Cliente", exemplo: "0001" },
  { email: "cliente2@fixit.example", nome: "Cliente Dois (fictício)", papel: "Cliente", exemplo: "0002" },
  { email: "manutentor@fixit.example", nome: "Manutentor (fictício)", papel: "Manutentor", exemplo: "0003" },
  { email: "gestor@fixit.example", nome: "Gestor (fictício)", papel: "Gestor", exemplo: "0004" },
];
const users = [];
for (let page = 1; ; page++) {
  const result = await admin.auth.admin.listUsers({ page, perPage: 100 });
  if (result.error) throw new Error("Não foi possível consultar as contas administrativas.");
  users.push(...result.data.users);
  if (result.data.users.length < 100) break;
}
for (const fixture of fixtures) {
  const existing = users.find((user) => user.email?.toLowerCase() === fixture.email);
  let id = existing?.id;
  if (existing) {
    const profile = await admin.from("perfis").select("nome,papel,excluido_em,provisionamento_pendente").eq("id", existing.id).single();
    if (existing.app_metadata.fixit_fixture !== "spec001" || profile.error ||
      profile.data.nome !== fixture.nome || profile.data.papel !== fixture.papel || profile.data.excluido_em || profile.data.provisionamento_pendente) {
      throw new Error(`Colisão em ${fixture.email}: conta preservada; revise administrativamente.`);
    }
  } else {
    id = randomUUID();
    const reserved = await admin.from("perfis").insert({ id, nome: fixture.nome, papel: fixture.papel, provisionamento_pendente: true });
    if (reserved.error) throw new Error(`Falha ao preparar o papel inicial de ${fixture.email}.`);
    const created = await admin.auth.admin.createUser({
      id, email: fixture.email, password, email_confirm: true,
      user_metadata: { nome: fixture.nome },
      app_metadata: { fixit_fixture: "spec001" },
    });
    if (created.error) throw new Error(`Falha ao preparar ${fixture.email}; nenhum usuário existente foi alterado.`);
    const assigned = await admin.from("perfis").update({ provisionamento_pendente: false }).eq("id", id);
    if (assigned.error) {
      await admin.auth.admin.deleteUser(id);
      await admin.from("perfis").delete().eq("id", id);
      throw new Error(`Falha ao preparar o papel inicial de ${fixture.email}.`);
    }
  }
  // Verifica senha sem regravá-la: reruns nunca trocam credenciais existentes.
  const client = createClient(config.url, config.publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const signed = await client.auth.signInWithPassword({ email: fixture.email, password });
  if (signed.error || signed.data.user.id !== id) throw new Error(`Conta ${fixture.email} preservada, mas a senha fornecida não autentica.`);
  if (fixture.papel === "Cliente") {
    for (let number = 1; number <= 21; number++) {
      const input = {
        local: `Sala fictícia ${number}`,
        categoria_id: "20000000-0000-4000-8000-000000000001",
        assunto: `SPEC-001 exemplo ${fixture.exemplo}-${String(number).padStart(2, "0")}`,
        descricao: "Lâmpada fictícia apagada. Exemplo para consulta e isolamento.",
      };
      const existingRows = await client.from("solicitacoes").select("*").eq("assunto", input.assunto);
      if (existingRows.error) throw new Error("Falha ao verificar exemplos de solicitação.");
      if (existingRows.data.length > 1) throw new Error(`Colisão no exemplo ${input.assunto}: registros preservados.`);
      let row = existingRows.data[0];
      if (!row) {
        const created = await criarSolicitacao(client, input);
        if (!created.data) throw new Error(`Falha ao criar exemplo ${input.assunto}.`);
        row = created.data;
      }
      if (row.autor_id !== id || row.estado !== "Pendente" || Object.entries(input).some(([key, value]) => row[key] !== value) ||
        ["motivo", "pessoas_areas_afetadas", "frequencia", "tipo_utilizacao", "riscos", "patrimonios_afetados"].some(key => row[key] !== null)) {
        throw new Error(`Colisão no exemplo ${input.assunto}: registro preservado.`);
      }
      const history = await client.from("historico_solicitacoes").select("*").eq("solicitacao_id", row.id);
      const event = history.data?.[0];
      if (history.error || history.data?.length !== 1 || event.autor_id !== id || event.criado_em !== row.criado_em ||
        event.descricao !== "Solicitação criada." || event.estado_anterior !== null || event.estado_novo !== "Pendente") {
        throw new Error(`Histórico divergente no exemplo ${input.assunto}: dados preservados.`);
      }
    }
    console.log(`21 solicitações fictícias e eventos verificados para ${fixture.email}.`);
  }
  await client.auth.signOut();
  console.log(`Conta fictícia verificada: ${fixture.email} (${fixture.papel}).`);
}
