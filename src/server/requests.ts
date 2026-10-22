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

function validarCampos(values: Record<string, unknown>) {
  if (Object.keys(values).some(key => ![...required, ...optional].includes(key))) return null;
  const row: Record<string, string | null> = {};
  for (const key of [...required, ...optional]) {
    const value = values[key];
    if (required.includes(key) ? typeof value !== "string" || !value.trim() : value != null && typeof value !== "string") {
      return null;
    }
    row[key] = typeof value === "string" ? value.trim() || null : null;
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(row.categoria_id!)) return null;
  return row;
}

export async function criarSolicitacao(client: SupabaseClient, input: unknown): Promise<ResultadoCriacao> {
  const identidade = await obterIdentidade(client);
  if (!identidade) return { data: null, erro: "nao_autenticado" };
  if (identidade.papel !== "Cliente") return { data: null, erro: "nao_autorizado" };
  if (!input || typeof input !== "object" || Array.isArray(input)) return { data: null, erro: "dados_invalidos" };
  const row = validarCampos(input as Record<string, unknown>);
  if (!row) return { data: null, erro: "dados_invalidos" };
  const { data, error } = await client.from("solicitacoes").insert(row).select("*").single();
  if (error) return { data: null, erro: ["23502", "23503", "23514", "22P02"].includes(error.code) ? "dados_invalidos" : "falha_persistencia" };
  return { data, erro: null };
}

export type ResultadoConsulta<T> = { data: T | null; erro: null | "nao_autenticado" | "nao_autorizado" | "dados_invalidos" | "nao_encontrado" | "falha_consulta" };
type ResumoSolicitacao = Pick<Solicitacao, "id" | "assunto" | "categoria_id" | "criado_em" | "estado">;
export type PaginaSolicitacoes = { itens: ResumoSolicitacao[]; pagina: number; tamanho_pagina: 20; total: number };

function paginaValida(pagina: unknown): pagina is number {
  return typeof pagina === "number" && Number.isSafeInteger(pagina) && pagina >= 1 && pagina <= Math.floor(2147483647 / 20);
}

async function paginaVazia(client: SupabaseClient, autorId: string, pagina: number): Promise<ResultadoConsulta<PaginaSolicitacoes>> {
  const total = await client.from("solicitacoes").select("id", { count: "exact", head: true }).eq("autor_id", autorId);
  if (total.error) return { data: null, erro: "falha_consulta" };
  return { data: { itens: [], pagina, tamanho_pagina: 20, total: total.count ?? 0 }, erro: null };
}

export async function listarSolicitacoes(client: SupabaseClient, pagina: unknown = 1): Promise<ResultadoConsulta<PaginaSolicitacoes>> {
  const identidade = await obterIdentidade(client);
  if (!identidade) return { data: null, erro: "nao_autenticado" };
  if (identidade.papel !== "Cliente") return { data: null, erro: "nao_autorizado" };
  if (!paginaValida(pagina)) return { data: null, erro: "dados_invalidos" };
  const offset = (pagina - 1) * 20;
  const { data, error, count } = await client.from("solicitacoes")
    .select("id,assunto,categoria_id,criado_em,estado", { count: "exact" })
    .eq("autor_id", identidade.id).order("criado_em", { ascending: false }).order("id", { ascending: false })
    .range(offset, offset + 19);
  if (error?.code === "PGRST103") {
    return paginaVazia(client, identidade.id, pagina);
  }
  if (error) return { data: null, erro: "falha_consulta" };
  return { data: { itens: data, pagina, tamanho_pagina: 20, total: count ?? 0 }, erro: null };
}

export type EventoSolicitacao = {
  id: string; solicitacao_id: string; autor_id: string; criado_em: string;
  descricao: string; estado_anterior: string | null; estado_novo: string;
};

export async function obterSolicitacao(client: SupabaseClient, id: unknown): Promise<ResultadoConsulta<Solicitacao>> {
  const identidade = await obterIdentidade(client);
  if (!identidade) return { data: null, erro: "nao_autenticado" };
  if (identidade.papel !== "Cliente") return { data: null, erro: "nao_autorizado" };
  if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return { data: null, erro: "dados_invalidos" };
  const { data, error } = await client.from("solicitacoes").select("*").eq("id", id).eq("autor_id", identidade.id).maybeSingle();
  if (error) return { data: null, erro: "falha_consulta" };
  return data ? { data, erro: null } : { data: null, erro: "nao_encontrado" };
}

export async function obterHistoricoSolicitacao(client: SupabaseClient, id: unknown): Promise<ResultadoConsulta<EventoSolicitacao[]>> {
  const solicitacao = await obterSolicitacao(client, id);
  if (!solicitacao.data) return { data: null, erro: solicitacao.erro };
  const { data, error } = await client.from("historico_solicitacoes").select("*")
    .eq("solicitacao_id", solicitacao.data.id).order("criado_em", { ascending: true }).order("id", { ascending: true });
  return error ? { data: null, erro: "falha_consulta" } : { data, erro: null };
}
