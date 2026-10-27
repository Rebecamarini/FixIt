import type { Metadata } from "next";
import Link from "next/link";
import { createSessionClient } from "../../server/session";
import { listarSolicitacoes } from "../../server/requests";
import { criarPaginacao, interpretarPagina, obterEstadoListagem } from "./listagem";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Minhas solicitações | FixIt" };
export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ pagina?: string | string[] }>;
};

const formatadorData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export default async function MinhasSolicitacoes({ searchParams }: PageProps) {
  const pagina = interpretarPagina((await searchParams).pagina);
  const client = await createSessionClient();
  const resultado = await listarSolicitacoes(client, pagina);

  if (resultado.erro === "nao_autenticado") {
    return <MensagemDeAcesso titulo="Sessão necessária">Entre no FixIt para consultar suas solicitações.</MensagemDeAcesso>;
  }
  if (resultado.erro === "nao_autorizado") {
    return <MensagemDeAcesso titulo="Acesso restrito">Esta área é exclusiva para Clientes.</MensagemDeAcesso>;
  }
  if (!resultado.data) throw new Error("Não foi possível consultar as solicitações.");

  const { itens, total } = resultado.data;
  const estado = obterEstadoListagem(total, itens.length);
  const paginacao = criarPaginacao(pagina, total);

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <p className={styles.brand}>FixIt</p>
        <h1>Minhas solicitações</h1>
        <p>Acompanhe os pedidos de manutenção que você registrou.</p>
      </header>

      {estado === "vazio" ? (
        <section className={styles.empty} aria-labelledby="empty-title">
          <h2 id="empty-title">Nenhuma solicitação registrada</h2>
          <p>Quando você enviar uma solicitação, ela aparecerá aqui.</p>
        </section>
      ) : estado === "pagina-vazia" ? (
        <section className={styles.empty} aria-labelledby="page-empty-title">
          <h2 id="page-empty-title">Esta página não possui solicitações</h2>
          <p>Retorne a uma página anterior para continuar consultando seus pedidos.</p>
        </section>
      ) : (
        <ul className={styles.list} aria-label="Solicitações próprias">
          {itens.map((solicitacao) => (
            <li key={solicitacao.id}>
              <article className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <p className={styles.identifier}>ID {solicitacao.id}</p>
                    <h2>{solicitacao.assunto}</h2>
                  </div>
                  <span className={styles.status}>{solicitacao.estado}</span>
                </div>
                <dl className={styles.summary}>
                  <div><dt>Categoria</dt><dd>{solicitacao.categoria.nome}</dd></div>
                  <div><dt>Data</dt><dd><time dateTime={solicitacao.criado_em}>{formatadorData.format(new Date(solicitacao.criado_em))}</time></dd></div>
                </dl>
                <Link className={styles.detailsLink} href={`/solicitacoes/${solicitacao.id}`}>
                  Abrir detalhes
                </Link>
              </article>
            </li>
          ))}
        </ul>
      )}

      {(paginacao.totalPaginas > 1 || pagina > 1) && (
        <nav className={styles.pagination} aria-label="Paginação das solicitações">
          {paginacao.anterior ? <Link href={`/solicitacoes?pagina=${paginacao.anterior}`}>Página anterior</Link> : <span> Página anterior </span>}
          <p>Página {pagina} de {paginacao.totalPaginas || 1}</p>
          {paginacao.proxima ? <Link href={`/solicitacoes?pagina=${paginacao.proxima}`}>Próxima página</Link> : <span>Próxima página</span>}
        </nav>
      )}
    </main>
  );
}

function MensagemDeAcesso({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <main className={styles.main}>
      <p className={styles.brand}>FixIt</p>
      <section className={styles.empty}>
        <h1>{titulo}</h1>
        <p>{children}</p>
      </section>
    </main>
  );
}
