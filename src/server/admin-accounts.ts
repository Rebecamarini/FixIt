import "server-only";
import { randomUUID } from "node:crypto";
import { createClient, type AuthError } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./config.ts";
import { obterIdentidade, type Papel } from "./identity.ts";
import type { SupabaseClient } from "@supabase/supabase-js";

const unavailable = "Não foi possível acessar o FixIt. Tente novamente em instantes.";
const uncertainCreation = "Não foi possível confirmar a criação. Use Conferir criação antes de iniciar outra tentativa.";
const uncertainDeletion = "Não foi possível confirmar a exclusão e a liberação do e-mail. Tente novamente para conferir o resultado.";
const papelValido = (value: string): value is Papel => ["Cliente", "Manutentor", "Gestor"].includes(value);

function adminClient() {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error(unavailable);
  const { url } = getSupabaseConfig();
  return createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
}

export type AccountListItem = { id: string; nome: string; email: string; papel: Papel };
export type AdminState = { success?: boolean; retryable?: boolean; creationId?: string; message?: string; errors?: Record<string, string>; values?: { nome: string; email: string; papel: string } };

async function gestorAtivo(client: SupabaseClient) {
  const identity = await obterIdentidade(client);
  return identity?.papel === "Gestor" ? identity : null;
}

function accountPage(page: number | undefined) {
  return Number.isSafeInteger(page) && page! > 0 && page! <= 2147483647 ? page : 1;
}

export async function listarContas(client: SupabaseClient, options: { q?: string; papel?: string; page?: number }): Promise<{ items: AccountListItem[]; total: number; page: number; forbidden: boolean; ownId: string }> {
  const gestor = await gestorAtivo(client);
  const denied = { items: [], total: 0, page: 1, forbidden: true, ownId: "" };
  if (!gestor) return denied;
  const { data, error } = await adminClient().rpc("us004_listar_contas", {
    autor: gestor.id,
    busca: options.q?.trim() ?? "",
    filtro_papel: papelValido(options.papel ?? "") ? options.papel : "",
    pagina: accountPage(options.page),
  });
  if (error?.code === "42501") return denied;
  if (error || !data) throw new Error(unavailable);
  return { ...data, ownId: gestor.id };
}

type AccountValues = NonNullable<AdminState["values"]>;

function creationErrors(values: AccountValues, senha: FormDataEntryValue | null) {
  const errors: Record<string, string> = {};
  if (!values.nome) errors.nome = "Informe o nome.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = "Informe um e-mail válido.";
  if (!["Manutentor", "Gestor"].includes(values.papel)) errors.papel = "Selecione Manutentor ou Gestor.";
  if (typeof senha !== "string" || senha.length < 8) errors.senha = "A senha deve ter pelo menos 8 caracteres.";
  return errors;
}

function creationFailure(error: AuthError): AdminState | null {
  if (["email_exists", "user_already_exists"].includes(error.code ?? "")) return { errors: { email: "Este e-mail já está em uso." }, message: "Confira o e-mail." };
  if (error.code === "weak_password") return { errors: { senha: "Escolha uma senha mais forte, com pelo menos 8 caracteres." }, message: "Confira a senha." };
  if (error.status === 429) return { message: "Muitas tentativas. Aguarde um pouco antes de tentar novamente." };
  if (isClientError(error)) return { message: unavailable };
  return null;
}

function isClientError(error: AuthError) {
  return !!error.status && error.status >= 400 && error.status < 500;
}

async function finalizeCreation(admin: SupabaseClient, id: string, autor: string): Promise<AdminState | null> {
  // Pending accounts cannot authenticate into the application or appear in lists.
  // Recheck the Gestor under the same lock used by account deletion.
  const { error } = await admin.rpc("us004_finalizar_criacao", { alvo: id, autor });
  if (error?.code === "42501") {
    const rollback = await admin.auth.admin.deleteUser(id);
    if (rollback.error) return { creationId: id, message: uncertainCreation };
    await admin.from("perfis").delete().eq("id", id);
    return { message: "Sua sessão não tem mais permissão para criar contas." };
  }
  return error ? { creationId: id, message: uncertainCreation } : null;
}

async function rejectedCreation(admin: SupabaseClient, id: string, error: AuthError): Promise<AdminState> {
  if (isClientError(error)) await admin.from("perfis").delete().eq("id", id);
  return creationFailure(error) ?? { creationId: id, message: uncertainCreation };
}

async function createPreparedAccount(admin: SupabaseClient, id: string, autor: string, values: AccountValues, senha: FormDataEntryValue | null): Promise<AdminState> {
  const { error: preparationError } = await admin.rpc("us004_preparar_criacao", {
    alvo: id, autor, nome_inicial: values.nome, papel_inicial: values.papel,
  });
  if (preparationError?.code === "42501") return { values, message: "Sua sessão não tem mais permissão para criar contas." };
  if (preparationError) return { values, creationId: id, message: uncertainCreation };
  const { data, error } = await admin.auth.admin.createUser({
    id, email: values.email, password: String(senha), email_confirm: true,
    user_metadata: { nome: values.nome },
  });
  if (error) return { values, ...await rejectedCreation(admin, id, error) };
  if (data.user?.id !== id || !data.user.email) return { values, creationId: id, message: uncertainCreation };
  const failed = await finalizeCreation(admin, id, autor);
  if (failed) return { values, ...failed };

  return { success: true, values, message: `Conta criada para ${data.user.email}.` };
}

export async function criarConta(client: SupabaseClient, form: FormData): Promise<AdminState> {
  const text = (name: string) => typeof form.get(name) === "string" ? String(form.get(name)).trim() : "";
  const values = {
    nome: text("nome"), email: text("email"), papel: text("papel"),
  };
  const senha = form.get("senha");
  let writing = false;
  let creationId: string | undefined;
  try {
    const gestor = await gestorAtivo(client);
    if (!gestor) return { message: "Você não tem permissão para criar contas." };
    const errors = creationErrors(values, senha);
    if (Object.keys(errors).length) return { values, errors, message: "Confira os campos indicados." };
    const admin = adminClient();
    const id = randomUUID();
    creationId = id;
    writing = true;
    return await createPreparedAccount(admin, id, gestor.id, values, senha);
  } catch { return { values, creationId: writing ? creationId : undefined, message: writing ? uncertainCreation : unavailable }; }
}

export async function conferirCriacao(client: SupabaseClient, creationId: string): Promise<AdminState> {
  try {
    const gestor = await gestorAtivo(client);
    if (!gestor) return { message: "Você não tem permissão para conferir a criação." };
    const admin = adminClient();
    const { error } = await admin.rpc("us004_finalizar_criacao", { alvo: creationId, autor: gestor.id });
    if (error?.code === "42501") return { message: "Sua sessão não tem mais permissão para conferir a criação." };
    if (error) return { creationId, message: "A criação ainda não foi concluída. Aguarde e confira novamente. Se persistir, procure o responsável pelo FixIt." };
    const [profile, auth] = await Promise.all([
      admin.from("perfis").select("nome,papel").eq("id", creationId).is("excluido_em", null).single(),
      admin.auth.admin.getUserById(creationId),
    ]);
    if (profile.error || auth.error || !auth.data.user.email) return { creationId, message: uncertainCreation };
    return { success: true, values: { nome: profile.data.nome, papel: profile.data.papel, email: auth.data.user.email }, message: "Criação confirmada." };
  } catch { return { creationId, message: uncertainCreation }; }
}

function deletionFailure(code: string): AdminState {
  const messages: Record<string, string> = {
    "42501": "Sua sessão não tem mais permissão para excluir contas.",
    "22023": "Não é possível excluir a própria conta.",
    "P0002": "A conta selecionada não existe.",
    "23514": "Não é possível excluir o último Gestor ativo.",
  };
  return Object.hasOwn(messages, code) ? { message: messages[code] } : { retryable: true, message: uncertainDeletion };
}

export async function excluirConta(client: SupabaseClient, alvo: string): Promise<AdminState> {
  let writing = false;
  try {
    const gestor = await gestorAtivo(client);
    if (!gestor) return { message: "Você não tem permissão para excluir contas." };
    const admin = adminClient();
    writing = true;
    const { data: status, error: dbError } = await admin.rpc("us004_excluir_conta", { alvo, autor: gestor.id });
    if (dbError) return deletionFailure(dbError.code);
    const { error: authError } = await admin.auth.admin.deleteUser(alvo);
    if (authError && authError.status !== 404 && authError.code !== "user_not_found") {
      return { retryable: true, message: "A conta foi bloqueada, mas não foi possível confirmar a liberação do e-mail. Tente novamente mais tarde." };
    }
    return { success: true, message: status === "ja_excluida" ? "Esta conta já havia sido excluída." : "Conta excluída. O e-mail está liberado para um novo cadastro." };
  } catch { return { retryable: writing, message: writing ? uncertainDeletion : unavailable }; }
}
