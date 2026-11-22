import type { ResumoSolicitacao } from "../server/requests.ts";

export function filtrarSolicitacoes(itens: ResumoSolicitacao[], busca: string, estado: string, locais: ReadonlyMap<string, string> = new Map()) {
  const normalizar = (valor: string) => valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
  const termo = normalizar(busca);
  return itens.filter(item => (!estado || item.estado === estado)
    && [`#${item.id}`, item.assunto, item.categoria.nome, locais.get(item.id) ?? ""].some(valor => normalizar(valor).includes(termo)));
}
