import "server-only";
import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./config.ts";

type Papel = "Cliente" | "Manutentor" | "Gestor";
export type Identidade = { id: string; papel: Papel };

// Uma instância por requisição: nunca compartilhar sessão entre usuários.
export function createRequestClient(cookies: CookieMethodsServer) {
  const { url, publishableKey } = getSupabaseConfig();
  return createServerClient(url, publishableKey, { cookies });
}

export async function obterIdentidade(client: SupabaseClient): Promise<Identidade | null> {
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return null;
  const profile = await client.from("perfis").select("id,papel").eq("id", user.id).maybeSingle();
  if (profile.error) throw new Error("Não foi possível verificar o perfil autenticado.");
  if (!profile.data) return null;
  const { id, papel } = profile.data;
  if (!["Cliente", "Manutentor", "Gestor"].includes(papel)) throw new Error("Papel inválido no perfil.");
  return { id, papel };
}
