import type { Metadata } from "next";
import Link from "next/link";
import Header from "../../../components/cliente/Header";
import Sidebar from "../../../components/cliente/Sidebar";
import dashboard from "../cliente/page.module.css";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Abrir chamado · Demonstração | FixIt",
};

export default function SolicitacaoDemoPage() {
  return (
    <div className={dashboard.layout}>
      <div className={dashboard.sidebar}><Sidebar inicioHref="/demo/cliente" demonstracao /></div>
      <div className={dashboard.topo}><Header nome="Ana Souza" /></div>
      <main className={dashboard.main}>
        <div className={dashboard.boasVindas}>
          <div>
            <span className={dashboard.eyebrow}>FixIt</span>
            <h1>Abrir chamado</h1>
            <p>Informe o problema identificado. O gestor avaliará o atendimento.</p>
          </div>
        </div>
        <p className={styles.aviso} id="aviso-demonstracao">
          <strong>Página demonstrativa.</strong> Os campos são ilustrativos e não
          podem ser editados. Nenhuma solicitação será enviada ou salva.
        </p>
        <section className={styles.card} aria-label="Prévia do formulário de solicitação" aria-describedby="aviso-demonstracao">
          <fieldset className={styles.campos} disabled>
            <legend className={styles.legenda}>Dados da solicitação</legend>
            <div className={styles.campo}>
              <label htmlFor="demo-assunto">Assunto</label>
              <input id="demo-assunto" type="text" defaultValue="Ar-condicionado não está refrigerando" />
            </div>
            <div className={styles.linha}>
              <div className={styles.campo}>
                <label htmlFor="demo-local">Local</label>
                <input id="demo-local" type="text" defaultValue="Bloco A · Sala 203" />
              </div>
              <div className={styles.campo}>
                <label htmlFor="demo-categoria">Categoria</label>
                <select id="demo-categoria" defaultValue="climatizacao">
                  <option value="climatizacao">Climatização</option>
                </select>
              </div>
            </div>
            <div className={styles.campo}>
              <label htmlFor="demo-descricao">Descrição do problema</label>
              <textarea id="demo-descricao" rows={6} defaultValue="O ar-condicionado da sala 203 liga normalmente, mas não refrigera o ambiente. O problema foi percebido durante as atividades da manhã." />
            </div>
          </fieldset>
          <div className={styles.acoes}>
            <button className={styles.enviar} type="button" disabled aria-describedby="aviso-demonstracao">Enviar solicitação</button>
            <Link className={styles.cancelar} href="/demo/cliente">Cancelar</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
