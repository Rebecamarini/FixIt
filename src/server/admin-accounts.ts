import "server-only";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
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

export async function listarContas(client: SupabaseClient, options: { q?: string; papel?: string; page?: number }): Promise<{ items: AccountListItem[]; total: number; page: number; forbidden: boolean; ownId: string }> {
  const gestor = await gestorAtivo(client);
  const denied = { items: [], total: 0, page: 1, forbidden: true, ownId: "" };
  if (!gestor) return denied;
  const { data, error } = await adminClient().rpc("us004_listar_contas", {
    autor: gestor.id,
    busca: options.q?.trim() ?? "",
    filtro_papel: papelValido(options.papel ?? "") ? options.papel : "",
    pagina: Number.isSafeInteger(options.page) && options.page! > 0 && options.page! <= 2147483647 ? options.page : 1,
  });
  if (error?.code === "42501") return denied;
  if (error || !data) throw new Error(unavailable);
  return { ...data, ownId: gestor.id };
}

export async function criarConta(client: SupabaseClient, form: FormData): Promise<AdminState> {
  const text = (name: string) => typeof form.get(name) === "string" ? String(form.get(name)).trim() : "";
  const values = {
    nome: text("nome"), email: text("email"), papel: text("papel"),
  };
  const senha = form.get("senha");
  const errors: Record<string, string> = {};
  let writing = false;
  let creationId: string | undefined;
  try {
    const gestor = await gestorAtivo(client);
    if (!gestor) return { message: "Você não tem permissão para criar contas." };
    if (!values.nome) errors.nome = "Informe o nome.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = "Informe um e-mail válido.";
    if (!["Manutentor", "Gestor"].includes(values.papel)) errors.papel = "Selecione Manutentor ou Gestor.";
    if (typeof senha !== "string" || senha.length < 8) errors.senha = "A senha deve ter pelo menos 8 caracteres.";
    if (Object.keys(errors).length) return { values, errors, message: "Confira os campos indicados." };
    const admin = adminClient();
    const id = randomUUID();
    creationId = id;
    writing = true;
    const { error: preparationError } = await admin.rpc("us004_preparar_criacao", {
      alvo: id, autor: gestor.id, nome_inicial: values.nome, papel_inicial: values.papel,
    });
    if (preparationError?.code === "42501") return { values, message: "Sua sessão não tem mais permissão para criar contas." };
    if (preparationError) return { values, creationId, message: uncertainCreation };
    const { data, error } = await admin.auth.admin.createUser({
      id, email: values.email, password: String(senha), email_confirm: true,
      user_metadata: { nome: values.nome },
    });
    if (error) {
      if (error.status && error.status >= 400 && error.status < 500) await admin.from("perfis").delete().eq("id", id);
      if (["email_exists", "user_already_exists"].includes(error.code ?? "")) return { values, errors: { email: "Este e-mail já está em uso." }, message: "Confira o e-mail." };
      if (error.code === "weak_password") return { values, errors: { senha: "Escolha uma senha mais forte, com pelo menos 8 caracteres." }, message: "Confira a senha." };
      if (error.status === 429) return { values, message: "Muitas tentativas. Aguarde um pouco antes de tentar novamente." };
      if (error.status && error.status >= 400 && error.status < 500) return { values, message: unavailable };
      return { values, creationId, message: uncertainCreation };
    }
    if (data.user?.id !== id || !data.user.email) return { values, creationId, message: uncertainCreation };
    // Pending accounts cannot authenticate into the application or appear in lists.
    // Recheck the Gestor under the same lock used by account deletion.
    const { error: finalizeError } = await admin.rpc("us004_finalizar_criacao", { alvo: id, autor: gestor.id });
    if (finalizeError?.code === "42501") {
      const rollback = await admin.auth.admin.deleteUser(id);
      if (rollback.error) return { values, creationId, message: uncertainCreation };
      await admin.from("perfis").delete().eq("id", id);
      return { values, message: "Sua sessão não tem mais permissão para criar contas." };
    }
    if (finalizeError) return { values, creationId, message: uncertainCreation };

    return { success: true, values, message: `Conta criada para ${data.user.email}.` };
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

export async function excluirConta(client: SupabaseClient, alvo: string): Promise<AdminState> {
  let writing = false;
  try {
    const gestor = await gestorAtivo(client);
    if (!gestor) return { message: "Você não tem permissão para excluir contas." };
    const admin = adminClient();
    writing = true;
    const { data: status, error: dbError } = await admin.rpc("us004_excluir_conta", { alvo, autor: gestor.id });
    if (dbError) {
      if (dbError.code === "42501") return { message: "Sua sessão não tem mais permissão para excluir contas." };
      if (dbError.code === "22023") return { message: "Não é possível excluir a própria conta." };
      if (dbError.code === "P0002") return { message: "A conta selecionada não existe." };
      if (dbError.code === "23514") return { message: "Não é possível excluir o último Gestor ativo." };
      return { retryable: true, message: uncertainDeletion };
    }
    const { error: authError } = await admin.auth.admin.deleteUser(alvo);
    if (authError && authError.status !== 404 && authError.code !== "user_not_found") {
      return { retryable: true, message: "A conta foi bloqueada, mas não foi possível confirmar a liberação do e-mail. Tente novamente mais tarde." };
    }
    return { success: true, message: status === "ja_excluida" ? "Esta conta já havia sido excluída." : "Conta excluída. O e-mail está liberado para um novo cadastro." };
  } catch { return { retryable: writing, message: writing ? uncertainDeletion : unavailable }; }
}
