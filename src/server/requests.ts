import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { obterIdentidade } from "./identity.ts";
import { PAGINA_MAXIMA_SOLICITACOES, TAMANHO_PAGINA_SOLICITACOES } from "./request-pagination.ts";

export type Solicitacao = {
  id: string; autor_id: string; solicitante_id: string; categoria_id: string;
  local: string; assunto: string; descricao: string;
  motivo: string | null; pessoas_areas_afetadas: string | null; frequencia: string | null;
  tipo_utilizacao: string | null; riscos: string | null; patrimonios_afetados: string | null;
  criado_em: string; estado: "Pendente";
};
export type ResultadoCriacao = { ja_registrada?: boolean; autor_nome?: string; solicitante_nome?: string; data: Solicitacao | null; erro: null | "nao_autenticado" | "nao_autorizado" | "dados_invalidos" | "falha_persistencia" | "resultado_incerto" | "solicitante_indisponivel" | "categoria_indisponivel" };

const required = ["local", "assunto", "descricao", "categoria_id"];
const optional = ["motivo", "pessoas_areas_afetadas", "frequencia", "tipo_utilizacao", "riscos", "patrimonios_afetados"];

export async function criarSolicitacao(client: SupabaseClient, input: unknown, tentativa = crypto.randomUUID(), solicitante?: string, identidadeEsperada?: string): Promise<ResultadoCriacao> {
  const identidade = await obterIdentidade(client);
  if (!identidade) return { data: null, erro: "nao_autenticado" };
  if (identidadeEsperada && identidadeEsperada !== identidade.id) return { data: null, erro: "nao_autorizado" };
  if (solicitante && solicitante !== identidade.id && identidade.papel !== "Gestor") return { data: null, erro: "nao_autorizado" };
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
  try {
    const { data, error } = await client.rpc("us009_enviar_solicitacao", {
      dados: row, tentativa, identidade: identidade.id, solicitante: solicitante ?? null,
    });
    if (error) {
      const erro: ResultadoCriacao["erro"] = error.code === "P0002" ? "solicitante_indisponivel"
        : error.code === "P0003" ? "categoria_indisponivel"
        : error.code === "42501" ? "nao_autorizado"
        : ["23502", "23503", "23514", "22P02", "22023"].includes(error.code) ? "dados_invalidos"
        : /^([0-9A-Z]{5})$/.test(error.code) && !error.code.startsWith("08") ? "falha_persistencia" : "resultado_incerto";
      return { data: null, erro };
    }
    return { data: data.solicitacao, ja_registrada: data.ja_registrada,
      autor_nome: data.autor_nome, solicitante_nome: data.solicitante_nome, erro: null };
  } catch { return { data: null, erro: "resultado_incerto" }; }
}

export type ResultadoConsulta<T> = { data: T | null; erro: null | "nao_autenticado" | "nao_autorizado" | "dados_invalidos" | "nao_encontrado" | "falha_consulta" };
export type ResumoSolicitacao = Pick<Solicitacao, "id" | "assunto" | "categoria_id" | "criado_em" | "estado"> & {
  categoria: { nome: string };
};
export type PaginaSolicitacoes = { itens: ResumoSolicitacao[]; pagina: number; tamanho_pagina: typeof TAMANHO_PAGINA_SOLICITACOES; total: number };

export async function listarSolicitacoes(client: SupabaseClient, pagina: unknown = 1): Promise<ResultadoConsulta<PaginaSolicitacoes>> {
  const identidade = await obterIdentidade(client);
  if (!identidade) return { data: null, erro: "nao_autenticado" };
  if (identidade.papel !== "Cliente") return { data: null, erro: "nao_autorizado" };
  if (typeof pagina !== "number" || !Number.isSafeInteger(pagina) || pagina < 1 || pagina > PAGINA_MAXIMA_SOLICITACOES) return { data: null, erro: "dados_invalidos" };
  const offset = (pagina - 1) * TAMANHO_PAGINA_SOLICITACOES;
  const { data, error, count } = await client.from("solicitacoes")
    .select("id,assunto,categoria_id,criado_em,estado,categoria:categorias!inner(nome)", { count: "exact" })
    .eq("solicitante_id", identidade.id).order("criado_em", { ascending: false }).order("id", { ascending: false })
    .range(offset, offset + TAMANHO_PAGINA_SOLICITACOES - 1);
  if (error?.code === "PGRST103") {
    const total = await client.from("solicitacoes").select("id", { count: "exact", head: true }).eq("solicitante_id", identidade.id);
    if (total.error) return { data: null, erro: "falha_consulta" };
    return { data: { itens: [], pagina, tamanho_pagina: TAMANHO_PAGINA_SOLICITACOES, total: total.count ?? 0 }, erro: null };
  }
  if (error) return { data: null, erro: "falha_consulta" };
  const itens: ResumoSolicitacao[] = [];
  for (const row of data) {
    const relacionamento: unknown = row.categoria;
    const categoria = Array.isArray(relacionamento) ? relacionamento[0] : relacionamento;
    if (!categoria || typeof categoria !== "object" || !("nome" in categoria) || typeof categoria.nome !== "string") {
      return { data: null, erro: "falha_consulta" };
    }
    itens.push({ ...row, categoria: { nome: categoria.nome } });
  }
  return { data: { itens, pagina, tamanho_pagina: TAMANHO_PAGINA_SOLICITACOES, total: count ?? 0 }, erro: null };
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
  const { data, error } = await client.from("solicitacoes").select("*").eq("id", id).eq("solicitante_id", identidade.id).maybeSingle();
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
