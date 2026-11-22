import "server-only";
import { redirect } from "next/navigation";
import { createSessionClient } from "./session";
import { obterIdentidade } from "./identity";
import { listarSolicitacoes, obterSolicitacao, type ResumoSolicitacao } from "./requests";
import type { Chamado } from "../components/cliente/TabelaChamados";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function carregarConta() {
  const client = await createSessionClient();
  const identidade = await obterIdentidade(client);
  if (!identidade) redirect("/conta/entrar");
  const perfil = await client.from("perfis").select("nome").eq("id", identidade.id).single();
  if (perfil.error || !perfil.data) throw new Error("Não foi possível carregar sua conta.");
  return { client, identidade, nome: perfil.data.nome as string };
}

// Composição das consultas existentes: não altera contratos nem permissões.
// Percorre todas as páginas para que busca e indicadores não se limitem a vinte itens.
export async function carregarResumos(client: SupabaseClient) {
  const itens: ResumoSolicitacao[] = [];
  for (let pagina = 1; ; pagina++) {
    const resultado = await listarSolicitacoes(client, pagina);
    if (resultado.erro === "nao_autenticado") redirect("/conta/entrar");
    if (!resultado.data) throw new Error("Não foi possível consultar suas solicitações.");
    itens.push(...resultado.data.itens);
    if (pagina * resultado.data.tamanho_pagina >= resultado.data.total) break;
  }
  return [...new Map(itens.map(item => [item.id, item])).values()];
}

export async function carregarLinhas(client: SupabaseClient, itens: ResumoSolicitacao[], nome: string) {
  const linhas: Chamado[] = [];
  // Limita concorrência ao compor detalhes pelo contrato existente.
  for (let inicio = 0; inicio < itens.length; inicio += 5) {
    const lote = await Promise.all(itens.slice(inicio, inicio + 5).map(async item => {
      const resultado = await obterSolicitacao(client, item.id);
      if (resultado.erro === "nao_autenticado") redirect("/conta/entrar");
      if (!resultado.data) throw new Error("Não foi possível carregar os detalhes da listagem.");
      return { id: item.id, assunto: item.assunto, local: resultado.data.local,
        solicitante: nome, status: item.estado, prioridade: "Não disponível", data: item.criado_em };
    }));
    linhas.push(...lote);
  }
  return linhas;
}
