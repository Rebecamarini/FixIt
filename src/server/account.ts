import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { obterIdentidade } from "./identity.ts";

export type AccountState = {
  values?: { nome: string; email: string };
  errors?: Record<string, string>;
  message?: string;
  success?: boolean;
};

const rejected = "Não foi possível criar a conta. Confira os dados; o e-mail pode já estar em uso.";
const unavailable = "Não foi possível acessar o FixIt. Tente novamente em instantes.";

export async function cadastrarCliente(client: SupabaseClient, form: FormData): Promise<AccountState> {
  const text = (name: string) => typeof form.get(name) === "string" ? String(form.get(name)).trim() : "";
  const values = { nome: text("nome"), email: text("email") };
  const senha = form.get("senha");
  const errors: Record<string, string> = {};
  if (!values.nome) errors.nome = "Informe seu nome.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = "Informe um e-mail válido.";
  if (typeof senha !== "string" || senha.length < 8) errors.senha = "A senha deve ter pelo menos 8 caracteres.";
  if (Object.keys(errors).length) return { values, errors, message: "Confira os campos indicados." };

  try {
    const { data, error } = await client.auth.signUp({
      email: values.email, password: String(senha), options: { data: { nome: values.nome } },
    });
    if (error) {
      if (error.status === 429) return { values, message: "Muitas tentativas. Aguarde um pouco antes de tentar novamente." };
      if (error.code === "weak_password") return { values, errors: { senha: "Escolha uma senha mais forte, com pelo menos 8 caracteres." } };
      return { values, message: error.name === "AuthRetryableFetchError" && error.status !== 500 ? unavailable : rejected };
    }
    if (data.user?.identities?.length === 0) return { values, message: rejected };
    await client.auth.signOut({ scope: "local" }).catch(() => {});
    return { success: true };
  } catch { return { values, message: unavailable }; }
}

export async function entrarNaConta(client: SupabaseClient, form: FormData): Promise<AccountState> {
  const email = typeof form.get("email") === "string" ? String(form.get("email")).trim() : "";
  const senha = form.get("senha");
  const values = { nome: "", email };
  if (!email || typeof senha !== "string" || !senha) return { values, message: "Informe e-mail e senha." };
  try {
    const { error } = await client.auth.signInWithPassword({ email, password: senha });
    if (error?.status === 429) return { values, message: "Muitas tentativas. Aguarde um pouco antes de tentar novamente." };
    if (error) return { values, message: error.status === 400 ? "E-mail ou senha inválidos." : unavailable };
    if (!await obterIdentidade(client)) {
      await client.auth.signOut({ scope: "local" });
      return { values, message: "Não foi possível verificar seu perfil. Tente novamente." };
    }
    return { success: true };
  } catch {
    await client.auth.signOut({ scope: "local" }).catch(() => {});
    return { values, message: unavailable };
  }
}

export async function sairDaConta(client: SupabaseClient): Promise<AccountState> {
  try {
    const { error } = await client.auth.signOut({ scope: "local" });
    if (!error) return { success: true };
  } catch { /* Let the user retry without exposing provider details. */ }
  return { message: "Não foi possível sair. Tente novamente." };
}
