import { PAGINA_MAXIMA_SOLICITACOES, TAMANHO_PAGINA_SOLICITACOES } from "../../server/request-pagination.ts";

export type EstadoListagem = "vazio" | "pagina-vazia" | "com-itens";

export function interpretarPagina(valor: string | string[] | undefined): number {
  if (typeof valor !== "string" || !/^[1-9]\d*$/.test(valor)) return 1;
  const pagina = Number(valor);
  return Number.isSafeInteger(pagina) && pagina <= PAGINA_MAXIMA_SOLICITACOES ? pagina : 1;
}

export function criarPaginacao(pagina: number, total: number) {
  const totalPaginas = Math.ceil(total / TAMANHO_PAGINA_SOLICITACOES);
  return {
    totalPaginas,
    anterior: pagina > 1 ? pagina - 1 : null,
    proxima: pagina < totalPaginas ? pagina + 1 : null,
  };
}

export function obterEstadoListagem(total: number, quantidadeItens: number): EstadoListagem {
  if (total === 0) return "vazio";
  return quantidadeItens === 0 ? "pagina-vazia" : "com-itens";
}
