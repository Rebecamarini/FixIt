import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./config.ts";
import { createRequestClient, type Papel } from "./identity.ts";

export type Perfil = { id: string; nome: string; matricula: string; setor_id: string; papel: Papel; email: string };
export type ProfileState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string>;
  perfil?: Perfil;
  email?: string;
  sessionLost?: boolean;
  partial?: boolean;
};
const unavailable = "Não foi possível acessar o FixIt. Tente novamente em instantes.";
const uncertain = "Não foi possível confirmar a gravação. Confira os dados atuais antes de repetir.";
const lost: ProfileState = { sessionLost: true, message: "Sua sessão terminou. Entre novamente. As alterações não enviadas foram descartadas." };
const text = (form: FormData, key: string) => typeof form.get(key) === "string" ? String(form.get(key)).trim() : "";

export async function consultarPerfil(client: SupabaseClient): Promise<Perfil | null> {
  const { data: { user }, error } = await client.auth.getUser();
  if (error) {
    if ([401, 403].includes(error.status ?? 0) || error.name === "AuthSessionMissingError" || error.code === "refresh_token_not_found") return null;
    throw new Error(unavailable);
  }
  if (!user) return null;
  const result = await client.from("perfis").select("id,nome,matricula,setor_id,papel").eq("id", user.id).maybeSingle();
  if (result.error) throw new Error(unavailable);
  if (!result.data) return null;
  return { ...result.data, email: user.email ?? "" };
}

function manipulated(form: FormData, allowed: string[]) {
  return [...form.keys()].some(key => !allowed.includes(key) && !key.startsWith("$ACTION_"));
}

export async function salvarPerfil(client: SupabaseClient, form: FormData): Promise<ProfileState> {
  let writing = false;
  try {
    const perfil = await consultarPerfil(client);
    if (!perfil) return lost;
    if (manipulated(form, ["nome", "matricula", "setor_id"])) return { message: "Envie somente nome, matrícula e setor do seu perfil." };
    const values = { nome: text(form, "nome"), matricula: text(form, "matricula"), setor_id: text(form, "setor_id") };
    const errors: Record<string, string> = {};
    if (!values.nome) errors.nome = "Informe seu nome.";
    if (!values.matricula) errors.matricula = "Informe sua matrícula.";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(values.setor_id)) errors.setor_id = "Selecione um setor válido.";
    if (Object.keys(errors).length) return { errors, message: "Confira os campos indicados." };
    writing = true;
    const result = await client.from("perfis").update(values).eq("id", perfil.id).select("id,nome,matricula,setor_id,papel").maybeSingle();
    if (result.error?.code === "23505") return { errors: { matricula: "Esta matrícula já está em uso. Informe outra." }, message: "Confira a matrícula." };
    if (result.error?.code === "23503") return { errors: { setor_id: "Selecione um setor cadastrado." }, message: "Confira o setor." };
    if (result.error) return { message: result.error.code === "42501" ? "Não foi possível salvar seu perfil. Recarregue a página e tente novamente." : uncertain };
    if (!result.data) return lost;
    return { success: true, perfil: { ...result.data, email: perfil.email }, message: "Perfil salvo." };
  } catch { return { message: writing ? uncertain : unavailable }; }
}

function authError(error: { status?: number; code?: string }, writing = false): ProfileState {
  if (error.status === 429) return { message: "Muitas tentativas. Aguarde um pouco antes de tentar novamente." };
  if ([401, 403].includes(error.status ?? 0) || ["session_not_found", "refresh_token_not_found"].includes(error.code ?? "")) return lost;
  if (["email_exists", "user_already_exists"].includes(error.code ?? "")) return { errors: { email: "Este e-mail já está em uso. Informe outro." }, message: "Confira o e-mail." };
  if (error.code === "weak_password") return { errors: { nova_senha: "Escolha uma senha mais forte, com pelo menos 8 caracteres." }, message: "Confira a nova senha." };
  return { message: writing ? uncertain : unavailable };
}

async function verificarSenha(perfil: Perfil, senha: FormDataEntryValue | null): Promise<ProfileState | null> {
  if (typeof senha !== "string" || !senha) return { errors: { senha_atual: "Informe sua senha atual." }, message: "Confira a senha atual." };
  // A autenticação temporária nunca substitui cookies da sessão a preservar.
  const verifier = createRequestClient({ getAll: () => [], setAll: () => {} });
  try {
    const { data, error } = await verifier.auth.signInWithPassword({ email: perfil.email, password: senha });
    if (error?.code === "invalid_credentials") return { errors: { senha_atual: "Senha atual incorreta. Tente novamente." }, message: "Confira a senha atual." };
    if (error) return authError(error);
    if (data.user?.id !== perfil.id) return lost;
    return null;
  } finally { await verifier.auth.signOut({ scope: "local" }).catch(() => {}); }
}

export async function alterarEmail(client: SupabaseClient, form: FormData): Promise<ProfileState> {
  let writing = false;
  try {
    const perfil = await consultarPerfil(client);
    if (!perfil) return lost;
    if (manipulated(form, ["email", "senha_atual"])) return { message: "Envie somente o novo e-mail e sua senha atual." };
    const email = text(form, "email");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { errors: { email: "Informe um e-mail válido." }, message: "Confira o e-mail." };
    const invalid = await verificarSenha(perfil, form.get("senha_atual"));
    if (invalid) return invalid;
    writing = true;
    const { url } = getSupabaseConfig();
    const secret = process.env.SUPABASE_SECRET_KEY;
    if (!secret) return { message: "A alteração de e-mail está indisponível. Procure o responsável pelo FixIt." };
    // Exceção restrita aprovada no ADR 0004; ID obtido da sessão, nunca do formulário.
    const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await admin.auth.admin.updateUserById(perfil.id, { email, email_confirm: true });
    if (error?.status === 500) return { errors: { email: "Não foi possível confirmar a troca. O endereço pode estar em uso; confira seu e-mail atual antes de tentar outro." }, message: uncertain };
    if (error && [401, 403].includes(error.status ?? 0)) return { message: "A alteração de e-mail está indisponível. Procure o responsável pelo FixIt." };
    if (error) return authError(error, true);
    if (data.user?.email?.toLowerCase() !== email.toLowerCase() || data.user.new_email) return { message: "A troca imediata de e-mail não pôde ser confirmada. Confira seu e-mail atual antes de repetir e procure o responsável pelo FixIt." };
    return { success: true, email: data.user.email, message: "E-mail alterado. Use o novo endereço no próximo login." };
  } catch { return { message: writing ? uncertain : unavailable }; }
}

export async function encerrarOutrasSessoes(client: SupabaseClient): Promise<ProfileState> {
  try {
    if (!await consultarPerfil(client)) return lost;
    const { error } = await client.auth.signOut({ scope: "others" });
    if (!error) return { success: true, message: "Outras sessões não poderão ser renovadas. A sessão atual foi mantida; acessos já emitidos podem durar até expirar." };
    const result = authError(error);
    return result.sessionLost ? result : { ...result, partial: true, message: `${result.message} Tente novamente somente o encerramento das outras sessões.` };
  } catch { return { partial: true, message: "Não foi possível encerrar as outras sessões. Tente novamente somente o encerramento." }; }
}

export async function alterarSenha(client: SupabaseClient, form: FormData): Promise<ProfileState> {
  let writing = false;
  try {
    const perfil = await consultarPerfil(client);
    if (!perfil) return lost;
    if (manipulated(form, ["senha_atual", "nova_senha", "confirmar_senha"])) return { message: "Envie somente os campos de senha da sua conta." };
    const current = form.get("senha_atual");
    const password = form.get("nova_senha");
    const errors: Record<string, string> = {};
    if (typeof current !== "string" || !current) errors.senha_atual = "Informe sua senha atual.";
    if (typeof password !== "string" || password.length < 8) errors.nova_senha = "A nova senha deve ter pelo menos 8 caracteres.";
    else if (password === current) errors.nova_senha = "A nova senha deve ser diferente da atual.";
    if (password !== form.get("confirmar_senha")) errors.confirmar_senha = "A confirmação deve coincidir com a nova senha.";
    if (Object.keys(errors).length) return { errors, message: "Confira os campos indicados." };
    const invalid = await verificarSenha(perfil, current);
    if (invalid) return invalid;
    writing = true;
    const { error } = await client.auth.updateUser({ password: String(password) });
    if (error) return authError(error, true);
    const result = await encerrarOutrasSessoes(client);
    if (!result.success) return { ...result, partial: true, message: `Sua senha foi alterada, mas não foi possível confirmar o encerramento das outras sessões. ${result.message}` };
    return { ...result, message: `Senha alterada. ${result.message}` };
  } catch { return { message: writing ? uncertain : unavailable }; }
}
