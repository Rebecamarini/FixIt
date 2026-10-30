"use client";

import styles from "../page.module.css";

export default function ErroDetalhe({ reset }: { reset: () => void }) {
  return <main className={styles.main}><section className={styles.empty}>
    <h1>Não foi possível carregar a solicitação</h1>
    <p>Tente novamente em alguns instantes.</p>
    <button type="button" onClick={reset}>Tentar novamente</button>
  </section></main>;
}
