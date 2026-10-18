import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { obterIdentidade } from "./identity.ts";

export type Solicitacao = {
  id: string; autor_id: string; categoria_id: string;
  local: string; assunto: string; descricao: string;
  motivo: string | null; pessoas_areas_afetadas: string | null; frequencia: string | null;
  tipo_utilizacao: string | null; riscos: string | null; patrimonios_afetados: string | null;
  criado_em: string; estado: "Pendente";
};
export type ResultadoCriacao = { data: Solicitacao | null; erro: null | "nao_autenticado" | "nao_autorizado" | "dados_invalidos" | "falha_persistencia" };

const required = ["local", "assunto", "descricao", "categoria_id"];
const optional = ["motivo", "pessoas_areas_afetadas", "frequencia", "tipo_utilizacao", "riscos", "patrimonios_afetados"];

export async function criarSolicitacao(client: SupabaseClient, input: unknown): Promise<ResultadoCriacao> {
  const identidade = await obterIdentidade(client);
  if (!identidade) return { data: null, erro: "nao_autenticado" };
  if (identidade.papel !== "Cliente") return { data: null, erro: "nao_autorizado" };
  if (!input || typeof input !== "object" || Array.isArray(input)) return { data: null, erro: "dados_invalidos" };
  const values = input as Record<string, unknown>;
  if (Object.keys(values).some(key => ![...required, ...optional].includes(key))) return { data: null, erro: "dados_invalidos" };
  const row: Record<string, string | null> = {};
  for (const key of [...required, ...optional]) {
    const value = values[key];
    if (required.includes(key) ? typeof value !== "string" || !value.trim() : value != null && typeof value !== "string") {
      return { data: null, erro: "dados_invalidos" };
    }
    row[key] = typeof value === "string" ? value.trim() || null : null;
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(row.categoria_id!)) return { data: null, erro: "dados_invalidos" };
  const { data, error } = await client.from("solicitacoes").insert(row).select("*").single();
  if (error) return { data: null, erro: ["23502", "23503", "23514", "22P02"].includes(error.code) ? "dados_invalidos" : "falha_persistencia" };
  return { data, erro: null };
}
