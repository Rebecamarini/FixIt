import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { obterIdentidade } from "./identity.ts";

export type AccountState = {
  values?: { nome: string; email: string; matricula: string; setor_id: string };
  errors?: Record<string, string>;
  message?: string;
  success?: boolean;
};

const cadastroRecusado = "Não foi possível cadastrar. Verifique os dados; e-mail e matrícula devem ser únicos.";
const indisponivel = "Não foi possível acessar o FixIt. Tente novamente em instantes.";

function formText(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function validarCadastro(values: NonNullable<AccountState["values"]>, senha: FormDataEntryValue | null) {
  const errors: Record<string, string> = {};
  if (!values.nome) errors.nome = "Informe seu nome.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = "Informe um e-mail válido.";
  if (typeof senha !== "string" || senha.length < 8) errors.senha = "A senha deve ter pelo menos 8 caracteres.";
  if (!values.matricula) errors.matricula = "Informe sua matrícula.";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(values.setor_id)) errors.setor_id = "Selecione um setor válido.";
  return errors;
}

export async function cadastrarCliente(client: SupabaseClient, form: FormData): Promise<AccountState> {
  const values = { nome: formText(form, "nome"), email: formText(form, "email"), matricula: formText(form, "matricula"), setor_id: formText(form, "setor_id") };
  const senha = form.get("senha");
  const errors = validarCadastro(values, senha);
  if (Object.keys(errors).length) return { values, errors, message: "Confira os campos indicados." };

  try {
    const setor = await client.from("setores").select("id").eq("id", values.setor_id).maybeSingle();
    if (setor.error) return { values, message: indisponivel };
    if (!setor.data) return { values, errors: { setor_id: "Selecione um setor válido." } };
    const { error } = await client.auth.signUp({
      email: values.email, password: String(senha),
      options: { data: { nome: values.nome, matricula: values.matricula, setor_id: values.setor_id } },
    });
    if (error) {
      if (error.status === 429) return { values, message: "Muitas tentativas. Aguarde um pouco antes de tentar novamente." };
      if (error.code === "weak_password") return { values, errors: { senha: "Escolha uma senha mais forte, com pelo menos 8 caracteres." } };
      // O Auth pode encapsular a recusa transacional do perfil em HTTP 500,
      // inclusive para matrícula duplicada, sem expor qual constraint falhou.
      return { values, message: error.name === "AuthRetryableFetchError" && error.status !== 500 ? indisponivel : cadastroRecusado };
    }
    // A ação usa cookies isolados: a sessão do cadastro nunca chega ao navegador,
    // mesmo se a revogação remota estiver temporariamente indisponível.
    await client.auth.signOut({ scope: "local" }).catch(() => {});
    return { success: true };
  } catch {
    return { values, message: indisponivel };
  }
}

export async function entrarNaConta(client: SupabaseClient, form: FormData): Promise<AccountState> {
  const email = formText(form, "email");
  const senha = form.get("senha");
  const values = { nome: "", email, matricula: "", setor_id: "" };
  if (!email || typeof senha !== "string" || !senha) return { values, message: "Informe e-mail e senha." };
  try {
    const { error } = await client.auth.signInWithPassword({ email, password: senha });
    if (error?.status === 429) return { values, message: "Muitas tentativas. Aguarde um pouco antes de tentar novamente." };
    if (error) return { values, message: error.status === 400 ? "E-mail ou senha inválidos." : indisponivel };
    if (!await obterIdentidade(client)) {
      await client.auth.signOut({ scope: "local" });
      return { values, message: "Não foi possível verificar seu perfil. Tente novamente." };
    }
    return { success: true };
  } catch {
    // Evitar manter uma sessão parcialmente autenticada após falha de perfil.
    await client.auth.signOut({ scope: "local" }).catch(() => {});
    return { values, message: indisponivel };
  }
}

export async function sairDaConta(client: SupabaseClient): Promise<AccountState> {
  try {
    const { error } = await client.auth.signOut({ scope: "local" });
    if (!error) return { success: true };
  } catch { /* Falha de rede: permitir uma nova tentativa sem detalhes internos. */ }
  return { message: "Não foi possível sair. Tente novamente." };
}
