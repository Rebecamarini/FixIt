import Link from "next/link";
import styles from "../page.module.css";

export default function SolicitacaoNaoEncontrada() {
  return <main className={styles.main}><section className={styles.empty}>
    <h1>Solicitação não encontrada</h1>
    <p>Não foi possível encontrar a solicitação para esta conta.</p>
    <Link href="/solicitacoes">Voltar para minhas solicitações</Link>
  </section></main>;
}
