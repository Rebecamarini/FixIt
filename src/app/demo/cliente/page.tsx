import Cards from "../../../components/cliente/Cards";
import Link from "next/link";
import Header from "../../../components/cliente/Header";
import Sidebar from "../../../components/cliente/Sidebar";
import TabelaChamados from "../../../components/cliente/TabelaChamados";
import { chamadosRecentes, indicadores } from "./dados";
import styles from "./page.module.css";

export default function ClienteDemoPage() {
  return (
    <div className={styles.layout}>
      <div className={styles.sidebar}><Sidebar inicioHref="/demo/cliente" demonstracao /></div>
      <div className={styles.topo}><Header nome="Ana Souza" /></div>
        <main className={styles.main}>
          <div className={styles.boasVindas}>
            <div>
              <span className={styles.eyebrow}>FixIt</span>
              <h1>Olá, Ana!</h1>
              <p>Acompanhe as solicitações de manutenção que você abriu.</p>
            </div>
            <Link className={styles.novoChamado} href="/demo/solicitacao">＋ Novo chamado</Link>
          </div>
          <div className={styles.indicadores}>
            {indicadores.map((indicador) => (
              <Cards key={indicador.titulo} {...indicador} />
            ))}
          </div>
          <TabelaChamados chamados={chamadosRecentes} demonstracao />
        </main>
    </div>
  );
}
