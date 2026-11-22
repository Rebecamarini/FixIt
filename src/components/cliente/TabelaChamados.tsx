import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./TabelaChamados.module.css";

export type Chamado = {
  id: number;
  assunto: string;
  local: string;
  solicitante: string;
  status: "Pendente" | "Aprovada" | "Em atendimento" | "Concluída" | "Descartada";
  prioridade: "Não definida" | "Baixa" | "Média" | "Alta";
  /** Data no formato ISO YYYY-MM-DD. */
  data: string;
};

type TabelaChamadosProps = {
  chamados: readonly Chamado[];
  variante?: "recentes" | "todos";
  demonstracao?: boolean;
  children?: ReactNode;
};

const classesStatus: Record<Chamado["status"], string> = {
  Pendente: styles.pendente,
  Aprovada: styles.aprovada,
  Descartada: styles.descartada,
  "Em atendimento": styles.emAtendimento,
  Concluída: styles.concluida,
};

function formatarData(data: string) {
  return data.split("-").reverse().join("/");
}

function LinhaChamado({ chamado, baseHref }: { chamado: Chamado; baseHref: string }) {
  return (
    <tr>
      <th scope="row" className={styles.identificador}>#{chamado.id}</th>
      <td>
        <span className={styles.assunto}>{chamado.assunto}</span>
        <span className={styles.local}>{chamado.local}</span>
      </td>
      <td>{chamado.solicitante}</td>
      <td><span className={`${styles.status} ${classesStatus[chamado.status]}`}>{chamado.status}</span></td>
      <td><span className={styles.prioridade}>{chamado.prioridade}</span></td>
      <td><time dateTime={chamado.data}>{formatarData(chamado.data)}</time></td>
      <td>
        <Link className={styles.detalhes} href={`${baseHref}/${chamado.id}`} aria-label={`Ver detalhes do chamado #${chamado.id}`}>
          Ver detalhes <span aria-hidden="true">→</span>
        </Link>
      </td>
    </tr>
  );
}

function CabecalhoTabela() {
  return (
    <thead>
      <tr>
        <th scope="col">ID</th>
        <th scope="col">Assunto e localização</th>
        <th scope="col">Solicitante</th>
        <th scope="col">Status</th>
        <th scope="col">Prioridade</th>
        <th scope="col">Data de abertura</th>
        <th scope="col">Ações</th>
      </tr>
    </thead>
  );
}

export default function TabelaChamados({ chamados, variante = "recentes", demonstracao = false, children }: TabelaChamadosProps) {
  const recentes = variante === "recentes";
  const titulo = recentes ? "Chamados recentes" : "Meus chamados";
  const baseHref = demonstracao ? "/demo/cliente/solicitacoes" : "/solicitacoes";
  return (
    <section className={styles.card} aria-label={titulo}>
      {recentes && (
        <header className={styles.cabecalho}>
          <h2>{titulo}</h2>
          <Link className={styles.verTodos} href={baseHref}>Ver todos <span aria-hidden="true">→</span></Link>
        </header>
      )}
      {children}
      <div className={styles.rolagem} role="region" aria-label={`Tabela: ${titulo}`} tabIndex={0}>
        <table className={styles.tabela}>
          <caption className={styles.somenteLeitor}>{recentes ? "Últimos chamados de manutenção" : "Solicitações de manutenção do Cliente"}</caption>
          <CabecalhoTabela />
          <tbody>
            {chamados.length === 0 ? (
              <tr>
                <td className={styles.vazio} colSpan={7}>
                  <strong>{recentes ? "Nenhum chamado recente" : "Nenhum chamado encontrado"}</strong>
                  {recentes && <p>Seus chamados aparecerão aqui quando forem registrados.</p>}
                </td>
              </tr>
            ) : chamados.map((chamado) => (
              <LinhaChamado key={chamado.id} chamado={chamado} baseHref={baseHref} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
