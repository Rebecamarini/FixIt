"use server";
import { redirect } from "next/navigation";
import { createSessionClient } from "../../server/session.ts";
import { criarConta, conferirCriacao, excluirConta, type AdminState } from "../../server/admin-accounts.ts";

export async function criar(_previous: AdminState, form: FormData): Promise<AdminState> {
  let result: AdminState;
  try { result = await criarConta(await createSessionClient(), form); }
  catch { return { values: { nome: String(form.get("nome") ?? ""), email: String(form.get("email") ?? ""), papel: String(form.get("papel") ?? "") }, message: "Não foi possível acessar o FixIt. Tente novamente em instantes." }; }
  if (result.success) redirect(`/usuarios?criada=1&q=${encodeURIComponent(result.values?.email ?? "")}`);
  return result;
}

export async function excluir(_previous: AdminState, form: FormData): Promise<AdminState> {
  const id = String(form.get("id") ?? "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return { message: "Conta inválida." };
  try { return await excluirConta(await createSessionClient(), id); }
  catch { return { message: "Não foi possível acessar o FixIt. Tente novamente em instantes." }; }
}

export async function conferir(previous: AdminState, form: FormData): Promise<AdminState> {
  const id = String(form.get("criacao_id") ?? "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return { message: "Tentativa de criação inválida." };
  let result: AdminState;
  try { result = await conferirCriacao(await createSessionClient(), id); }
  catch { return { creationId: id, values: previous.values, message: "Não foi possível conferir a criação. Tente novamente em instantes." }; }
  if (result.success) redirect(`/usuarios?criada=1&q=${encodeURIComponent(result.values?.email ?? "")}`);
  return { ...result, values: result.values ?? previous.values };
}
