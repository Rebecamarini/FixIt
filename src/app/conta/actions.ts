"use server";

import { redirect } from "next/navigation";
import { createRequestClient, obterIdentidade } from "../../server/identity.ts";
import { createSessionClient } from "../../server/session.ts";
import { cadastrarCliente, entrarNaConta, sairDaConta, type AccountState } from "../../server/account.ts";

export async function cadastrar(_previous: AccountState, form: FormData): Promise<AccountState> {
  try {
    const session = await createSessionClient();
    if (await obterIdentidade(session)) return { message: "Saia da sua conta antes de criar outra." };
    const client = createRequestClient({ getAll: () => [], setAll: () => {} });
    const state = await cadastrarCliente(client, form);
    if (!state.success) return state;
  } catch {
    return { message: "Não foi possível acessar o FixIt. Tente novamente em instantes." };
  }
  redirect("/conta/entrar?cadastro=concluido");
}

export async function entrar(_previous: AccountState, form: FormData): Promise<AccountState> {
  try {
    const client = await createSessionClient();
    const state = await entrarNaConta(client, form);
    if (!state.success) return state;
  } catch {
    return { message: "Não foi possível acessar o FixIt. Tente novamente em instantes." };
  }
  redirect("/");
}

export async function sair(): Promise<AccountState> {
  try {
    const client = await createSessionClient();
    const state = await sairDaConta(client);
    if (!state.success) return state;
  } catch {
    return { message: "Não foi possível sair. Tente novamente." };
  }
  redirect("/conta/entrar");
}
