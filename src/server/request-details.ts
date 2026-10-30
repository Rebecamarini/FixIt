import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { obterSolicitacao, obterHistoricoSolicitacao, type ResultadoConsulta, type Solicitacao, type EventoSolicitacao } from "./requests.ts";

export type DetalheSolicitacao = {
  solicitacao: Solicitacao;
  categoria: string;
  historico: (EventoSolicitacao & { autor: string })[];
};

// A autorização permanece nos contratos compartilhados e na RLS.
export async function obterDetalheSolicitacao(client: SupabaseClient, id: unknown): Promise<ResultadoConsulta<DetalheSolicitacao>> {
  const solicitacao = await obterSolicitacao(client, id);
  if (!solicitacao.data) return { data: null, erro: solicitacao.erro };
  const historico = await obterHistoricoSolicitacao(client, id);
  if (!historico.data) return { data: null, erro: historico.erro };
  const autores = [...new Set(historico.data.map(evento => evento.autor_id))];
  const [categoria, perfis] = await Promise.all([
    client.from("categorias").select("nome").eq("id", solicitacao.data.categoria_id).single(),
    client.from("perfis").select("id,nome").in("id", autores),
  ]);
  if (categoria.error || !categoria.data || perfis.error) return { data: null, erro: "falha_consulta" };
  const nomes = new Map<string, string>((perfis.data ?? []).map(perfil => [perfil.id, perfil.nome]));
  return {
    data: {
      solicitacao: solicitacao.data,
      categoria: categoria.data.nome,
      historico: historico.data.map(evento => ({ ...evento, autor: nomes.get(evento.autor_id) ?? `Autor ${evento.autor_id}` })),
    },
    erro: null,
  };
}
