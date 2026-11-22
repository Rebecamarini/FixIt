import Link from "next/link";
import Header from "../../../../../components/cliente/Header";
import Sidebar from "../../../../../components/cliente/Sidebar";
import layout from "../../page.module.css";
import styles from "./page.module.css";

export default function ChamadoNaoEncontrado() {
  return (
    <div className={layout.layout}>
      <div className={layout.sidebar}><Sidebar demonstracao /></div>
      <div className={layout.topo}><Header nome="Ana Souza" /></div>
      <main className={layout.main}>
        <section className={styles.card}>
          <h1>Chamado não encontrado</h1>
          <p>Não encontramos esse chamado nos dados de demonstração.</p>
          <Link className={styles.voltar} href="/demo/cliente/solicitacoes">Voltar para Meus chamados</Link>
        </section>
      </main>
    </div>
  );
}
