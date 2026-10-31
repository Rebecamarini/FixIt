"use server";
import { createSessionClient } from "../../../server/session.ts";
import { salvarPerfil, alterarEmail, alterarSenha, encerrarOutrasSessoes, type ProfileState } from "../../../server/profile.ts";

export async function salvar(form: FormData): Promise<ProfileState> {
  try { return await salvarPerfil(await createSessionClient(), form); }
  catch { return { message: "Não foi possível acessar o FixIt. Tente novamente em instantes." }; }
}

export async function salvarEmail(form: FormData): Promise<ProfileState> {
  try { return await alterarEmail(await createSessionClient(), form); }
  catch { return { message: "Não foi possível confirmar a gravação. Confira o e-mail atual antes de repetir." }; }
}
export async function salvarSenha(form: FormData): Promise<ProfileState> {
  try { return await alterarSenha(await createSessionClient(), form); }
  catch { return { message: "Não foi possível confirmar a gravação. Confira sua senha antes de repetir." }; }
}
export async function encerrar(): Promise<ProfileState> {
  try { return await encerrarOutrasSessoes(await createSessionClient()); }
  catch { return { partial: true, message: "Não foi possível encerrar as outras sessões. Tente novamente." }; }
}
