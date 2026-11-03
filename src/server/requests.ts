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

function normalizarSolicitacao(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const values = input as Record<string, unknown>;
  const fields = [...required, ...optional];
  if (Object.keys(values).some(key => !fields.includes(key))) return null;
  const row: Record<string, string | null> = {};
  for (const key of fields) {
    const value = values[key];
    if (!valorValido(key, value)) return null;
    row[key] = typeof value === "string" ? value.trim() || null : null;
  }
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(row.categoria_id!) ? row : null;
}

function valorValido(key: string, value: unknown) {
  if (required.includes(key)) return typeof value === "string" && !!value.trim();
  return value == null || typeof value === "string";
}

function erroPersistencia(code: string): ResultadoCriacao["erro"] {
  const errors: Record<string, ResultadoCriacao["erro"]> = {
    P0002: "solicitante_indisponivel", P0003: "categoria_indisponivel", "42501": "nao_autorizado",
    "23502": "dados_invalidos", "23503": "dados_invalidos", "23514": "dados_invalidos", "22P02": "dados_invalidos", "22023": "dados_invalidos",
  };
  if (Object.hasOwn(errors, code)) return errors[code];
  return /^([0-9A-Z]{5})$/.test(code) && !code.startsWith("08") ? "falha_persistencia" : "resultado_incerto";
}

function envioAutorizado(identidade: { id: string; papel: string }, solicitante?: string, identidadeEsperada?: string) {
  if (identidadeEsperada && identidadeEsperada !== identidade.id) return false;
  return !solicitante || solicitante === identidade.id || identidade.papel === "Gestor";
}

export async function criarSolicitacao(client: SupabaseClient, input: unknown, tentativa = crypto.randomUUID(), solicitante?: string, identidadeEsperada?: string): Promise<ResultadoCriacao> {
  const identidade = await obterIdentidade(client);
  if (!identidade) return { data: null, erro: "nao_autenticado" };
  if (!envioAutorizado(identidade, solicitante, identidadeEsperada)) return { data: null, erro: "nao_autorizado" };
  const row = normalizarSolicitacao(input);
  if (!row) return { data: null, erro: "dados_invalidos" };
  try {
    const { data, error } = await client.rpc("us009_enviar_solicitacao", {
      dados: row, tentativa, identidade: identidade.id, solicitante: solicitante ?? null,
    });
    if (error) return { data: null, erro: erroPersistencia(error.code) };
    return { data: data.solicitacao, ja_registrada: data.ja_registrada,
      autor_nome: data.autor_nome, solicitante_nome: data.solicitante_nome, erro: null };
  } catch { return { data: null, erro: "resultado_incerto" }; }
}

export type ResultadoConsulta<T> = { data: T | null; erro: null | "nao_autenticado" | "nao_autorizado" | "dados_invalidos" | "nao_encontrado" | "falha_consulta" };
export type ResumoSolicitacao = Pick<Solicitacao, "id" | "assunto" | "categoria_id" | "criado_em" | "estado"> & {
  categoria: { nome: string };
};
export type PaginaSolicitacoes = { itens: ResumoSolicitacao[]; pagina: number; tamanho_pagina: typeof TAMANHO_PAGINA_SOLICITACOES; total: number };

function paginaValida(pagina: unknown): pagina is number {
  return typeof pagina === "number" && Number.isSafeInteger(pagina) && pagina >= 1 && pagina <= PAGINA_MAXIMA_SOLICITACOES;
}

async function paginaVazia(client: SupabaseClient, identidade: string, pagina: number): Promise<ResultadoConsulta<PaginaSolicitacoes>> {
  const total = await client.from("solicitacoes").select("id", { count: "exact", head: true }).eq("solicitante_id", identidade);
  if (total.error) return { data: null, erro: "falha_consulta" };
  return { data: { itens: [], pagina, tamanho_pagina: TAMANHO_PAGINA_SOLICITACOES, total: total.count ?? 0 }, erro: null };
}

function categoriaResumo(relacionamento: unknown) {
  const categoria = Array.isArray(relacionamento) ? relacionamento[0] : relacionamento;
  if (!categoria || typeof categoria !== "object" || !("nome" in categoria) || typeof categoria.nome !== "string") return null;
  return { nome: categoria.nome };
}

function normalizarResumos(rows: (Omit<ResumoSolicitacao, "categoria"> & { categoria: unknown })[]) {
  const itens: ResumoSolicitacao[] = [];
  for (const row of rows) {
    const categoria = categoriaResumo(row.categoria);
    if (!categoria) return null;
    itens.push({ ...row, categoria });
  }
  return itens;
}

export async function listarSolicitacoes(client: SupabaseClient, pagina: unknown = 1): Promise<ResultadoConsulta<PaginaSolicitacoes>> {
  const identidade = await obterIdentidade(client);
  if (!identidade) return { data: null, erro: "nao_autenticado" };
  if (identidade.papel !== "Cliente") return { data: null, erro: "nao_autorizado" };
  if (!paginaValida(pagina)) return { data: null, erro: "dados_invalidos" };
  const offset = (pagina - 1) * TAMANHO_PAGINA_SOLICITACOES;
  const { data, error, count } = await client.from("solicitacoes")
    .select("id,assunto,categoria_id,criado_em,estado,categoria:categorias!inner(nome)", { count: "exact" })
    .eq("solicitante_id", identidade.id).order("criado_em", { ascending: false }).order("id", { ascending: false })
    .range(offset, offset + TAMANHO_PAGINA_SOLICITACOES - 1);
  if (error?.code === "PGRST103") return paginaVazia(client, identidade.id, pagina);
  if (error) return { data: null, erro: "falha_consulta" };
  const itens = normalizarResumos(data);
  if (!itens) return { data: null, erro: "falha_consulta" };
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
