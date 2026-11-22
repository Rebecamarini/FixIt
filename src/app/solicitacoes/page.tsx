import type { Metadata } from "next";
import Link from "next/link";
import { carregarConta, carregarResumos, carregarLinhas } from "../../server/client-view";
import { filtrarSolicitacoes } from "../../lib/client-requests";
import { interpretarPagina, criarPaginacao } from "./listagem";
import { TAMANHO_PAGINA_SOLICITACOES } from "../../server/request-pagination";
import ClienteLayout from "../../components/cliente/ClienteLayout";
import TabelaChamados from "../../components/cliente/TabelaChamados";
import layout from "../../components/cliente/ClienteLayout.module.css";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Minhas solicitações | FixIt" };
export const dynamic = "force-dynamic";
type Parametros = { pagina?: string | string[]; busca?: string; estado?: string };

export default async function MinhasSolicitacoes({ searchParams }: { searchParams: Promise<Parametros> }) {
  const parametros = await searchParams;
  const busca = typeof parametros.busca === "string" ? parametros.busca : "";
  const estado = typeof parametros.estado === "string" ? parametros.estado : "";
  const pagina = interpretarPagina(parametros.pagina);
  const { client, identidade, nome } = await carregarConta();
  if (identidade.papel !== "Cliente") return <main><h1>Acesso restrito</h1><p>Esta área é exclusiva para Clientes.</p><Link href="/">Voltar ao início</Link></main>;
  const itens = await carregarResumos(client);
  const pesquisaveis = busca.trim() ? await carregarLinhas(client, itens, nome) : [];
  const locais = new Map(pesquisaveis.map(item => [item.id, item.local]));
  const filtrados = filtrarSolicitacoes(itens, busca, estado, locais);
  const offset = (pagina - 1) * TAMANHO_PAGINA_SOLICITACOES;
  const selecionados = filtrados.slice(offset, offset + TAMANHO_PAGINA_SOLICITACOES);
  const linhas = busca.trim()
    ? selecionados.map(item => pesquisaveis.find(linha => linha.id === item.id)!)
    : await carregarLinhas(client, selecionados, nome);
  return <ClienteLayout nome={nome}>
    <div className={layout.boasVindas}><div><h1>Meus chamados</h1><p>Consulte os atendimentos e acompanhe os status.</p></div><Link className={layout.novoChamado} href="/solicitacoes/nova">＋ Novo chamado</Link></div>
    <TabelaChamados chamados={linhas} variante="todos">
      <form className={styles.filtros} action="/solicitacoes">
        <div className={styles.busca}><label htmlFor="busca">Pesquisar chamados</label><input id="busca" name="busca" type="search" defaultValue={busca} placeholder="ID, assunto, localização ou categoria" /></div>
        <div className={styles.status}><label htmlFor="estado">Status</label><select id="estado" name="estado" defaultValue={estado}><option value="">Todos os status</option>{["Pendente", "Aprovada", "Em atendimento", "Concluída", "Descartada"].map(valor => <option key={valor}>{valor}</option>)}</select></div>
        <button className={layout.novoChamado} type="submit">Pesquisar</button><Link href="/solicitacoes">Limpar filtros</Link>
      </form>
      <p className={styles.resultados} role="status">{filtrados.length} solicitações encontradas</p>
      {!itens.length && <p>Nenhuma solicitação registrada. Quando você enviar uma solicitação, ela aparecerá aqui.</p>}
      {!!filtrados.length && !linhas.length && <p>Esta página não possui solicitações. Retorne à página anterior.</p>}
    </TabelaChamados>
    <Paginacao pagina={pagina} total={filtrados.length} busca={busca} estado={estado} />
  </ClienteLayout>;
}

function Paginacao({ pagina, total, busca, estado }: { pagina: number; total: number; busca: string; estado: string }) {
  const paginacao = criarPaginacao(pagina, total);
  const href = (valor: number) => `/solicitacoes?${new URLSearchParams({ busca, estado, pagina: String(valor) })}`;
  if (paginacao.totalPaginas <= 1 && pagina <= 1) return null;
  return <nav className={styles.pagination} aria-label="Paginação das solicitações">
    {paginacao.anterior && <Link href={href(paginacao.anterior)}>Página anterior</Link>}
    <p>Página {pagina} de {paginacao.totalPaginas || 1}</p>
    {paginacao.proxima && <Link href={href(paginacao.proxima)}>Próxima página</Link>}
  </nav>;
}
