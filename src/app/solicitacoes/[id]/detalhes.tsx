import type { DetalheSolicitacao } from "../../../server/request-details";
import Link from "next/link";
import styles from "../page.module.css";
import detailStyles from "./page.module.css";

const formatadorData = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

export function DetalhesSolicitacao({ detalhe }: { detalhe: DetalheSolicitacao }) {
  const { solicitacao, categoria, historico } = detalhe;
  const campos = [
    ["Categoria", categoria], ["Local", solicitacao.local], ["Descrição", solicitacao.descricao],
    ["Motivo", solicitacao.motivo], ["Pessoas/áreas afetadas", solicitacao.pessoas_areas_afetadas],
    ["Frequência", solicitacao.frequencia], ["Tipo de utilização", solicitacao.tipo_utilizacao],
    ["Riscos", solicitacao.riscos], ["Patrimônios afetados", solicitacao.patrimonios_afetados],
  ];
  return <main className={styles.main}>
    <Link href="/solicitacoes">Voltar para minhas solicitações</Link>
    <header className={styles.header}>
      <p className={styles.brand}>FixIt</p><h1>{solicitacao.assunto}</h1>
      <p className={styles.identifier}>ID {solicitacao.id}</p>
    </header>
    <section className={styles.card} aria-labelledby="dados-title">
      <div className={styles.cardHeader}><h2 id="dados-title">Dados da solicitação</h2><span className={styles.status}>{solicitacao.estado}</span></div>
      <dl className={`${styles.summary} ${detailStyles.fields}`}>
        <div><dt>Data de criação</dt><dd><time dateTime={solicitacao.criado_em}>{formatadorData.format(new Date(solicitacao.criado_em))}</time></dd></div>
        {campos.map(([nome, valor]) => <div key={nome}><dt>{nome}</dt><dd>{valor ?? "Não informado"}</dd></div>)}
      </dl>
    </section>
    <section className={`${styles.card} ${detailStyles.section}`} aria-labelledby="anexos-title">
      <h2 id="anexos-title">Anexos</h2><p>A consulta de anexos ainda não está disponível.</p>
    </section>
    <section className={`${styles.card} ${detailStyles.section}`} aria-labelledby="responsaveis-title">
      <h2 id="responsaveis-title">Responsáveis</h2><p>A consulta de responsáveis ainda não está disponível.</p>
    </section>
    <section className={`${styles.card} ${detailStyles.section}`} aria-labelledby="observacoes-title">
      <h2 id="observacoes-title">Observações</h2><p>A consulta de observações de atendimento ainda não está disponível.</p>
    </section>
    <section className={`${styles.card} ${detailStyles.section}`} aria-labelledby="historico-title">
      <h2 id="historico-title">Histórico</h2><p>Registro somente leitura.</p>
      {historico.length === 0 ? <p>Nenhum evento registrado.</p> : <ol className={detailStyles.history}>
        {historico.map(evento => <li key={evento.id}>
          <time dateTime={evento.criado_em}>{formatadorData.format(new Date(evento.criado_em))}</time>
          <p><strong>Autor:</strong> {evento.autor}</p><p>{evento.descricao}</p>
        </li>)}
      </ol>}
    </section>
  </main>;
}
