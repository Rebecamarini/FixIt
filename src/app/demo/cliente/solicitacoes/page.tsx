import Link from "next/link";
import Header from "../../../../components/cliente/Header";
import Sidebar from "../../../../components/cliente/Sidebar";
import { chamadosCliente } from "../dados";
import styles from "../page.module.css";
import ListaChamados from "./lista-chamados";

export default function SolicitacoesDemoPage() {
  return (
    <div className={styles.layout}>
      <div className={styles.sidebar}><Sidebar demonstracao /></div>
      <div className={styles.topo}><Header nome="Ana Souza" /></div>
      <main className={styles.main}>
        <div className={styles.boasVindas}>
          <div>
            <h1>Meus chamados</h1>
            <p>Consulte os atendimentos e acompanhe os status</p>
          </div>
          <Link className={styles.novoChamado} href="/demo/solicitacao">+ Novo chamado</Link>
        </div>
        <ListaChamados chamados={chamadosCliente.filter((chamado) => chamado.solicitante === "Ana Souza")} />
      </main>
    </div>
  );
}
