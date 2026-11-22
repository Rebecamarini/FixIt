import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "../../../../../components/cliente/Header";
import Sidebar from "../../../../../components/cliente/Sidebar";
import { chamadosCliente, type ChamadoDetalhado } from "../../dados";
import layout from "../../page.module.css";
import styles from "./page.module.css";

const classesStatus = {
  Pendente: styles.pendente,
  Aprovada: styles.aprovada,
  "Em atendimento": styles.emAtendimento,
  Concluída: styles.concluida,
  Descartada: styles.descartada,
};

function Data({ valor }: { valor: string }) {
  return <time dateTime={valor}>{valor.split("-").reverse().join("/")}</time>;
}

function InformacoesChamado({ chamado }: { chamado: ChamadoDetalhado }) {
  return (
    <section className={styles.card} aria-labelledby="titulo-chamado">
      <header className={styles.cabecalho}>
        <div>
          <p className={styles.numero}>Chamado #{chamado.id}</p>
          <h2 id="titulo-chamado">{chamado.assunto}</h2>
        </div>
        <span className={`${styles.status} ${classesStatus[chamado.status]}`}>{chamado.status}</span>
      </header>
      <dl className={styles.informacoes}>
        <div><dt>Data de abertura</dt><dd><Data valor={chamado.data} /></dd></div>
        <div><dt>Solicitante</dt><dd>{chamado.solicitante}</dd></div>
        <div><dt>Categoria</dt><dd>{chamado.categoria}</dd></div>
        <div><dt>Localização</dt><dd>{chamado.local}</dd></div>
        <div><dt>Prioridade</dt><dd>{chamado.prioridade}</dd></div>
        <div><dt>Manutentor responsável</dt><dd>{chamado.manutentor ?? "Ainda não atribuído"}</dd></div>
        <div className={styles.linhaInteira}>
          <dt>Bem patrimonial</dt>
          <dd>{chamado.bemPatrimonial
            ? `${chamado.bemPatrimonial.codigo} · ${chamado.bemPatrimonial.descricao}`
            : "Nenhum bem patrimonial vinculado"}</dd>
        </div>
      </dl>
      <div className={styles.descricao}>
        <h3>Descrição do problema</h3>
        <p>{chamado.descricao}</p>
      </div>
    </section>
  );
}

function HistoricoChamado({ chamado }: { chamado: ChamadoDetalhado }) {
  return (
    <section className={styles.card} aria-labelledby="titulo-historico">
      <header className={styles.cabecalho}>
        <div>
          <h2 id="titulo-historico">Histórico de acompanhamento</h2>
          <p>Atualizações do chamado em ordem cronológica</p>
        </div>
      </header>
      <ol className={styles.historico}>
        {chamado.historico.map((evento, indice) => (
          <li key={`${evento.data}-${indice}`}>
            <div className={styles.eventoCabecalho}>
              <h3>{evento.titulo}</h3>
              <Data valor={evento.data} />
            </div>
            <p className={styles.autor}>{evento.autor}</p>
            <p>{evento.descricao}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default async function DetalhesChamadoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const chamado = chamadosCliente.find((item) => String(item.id) === id && item.solicitante === "Ana Souza");

  if (!chamado) notFound();

  return (
    <div className={layout.layout}>
      <div className={layout.sidebar}><Sidebar demonstracao /></div>
      <div className={layout.topo}><Header nome="Ana Souza" /></div>
      <main className={layout.main}>
        <Link className={styles.voltar} href="/demo/cliente/solicitacoes">
          <span aria-hidden="true">←</span> Voltar para Meus chamados
        </Link>
        <div className={layout.boasVindas}>
          <div>
            <h1>Detalhes do chamado</h1>
            <p>Consulte as informações e acompanhe o atendimento</p>
          </div>
        </div>

        <InformacoesChamado chamado={chamado} />

        <HistoricoChamado chamado={chamado} />
      </main>
    </div>
  );
}
