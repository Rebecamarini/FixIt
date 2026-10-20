import { checkConnection } from "../server/connection";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function Home() {
  const connection = await checkConnection();

  return (
    <main className={styles.main}>
      <p className={styles.brand}>FixIt</p>
      <h1>Gestão de manutenção</h1>
      <p>A base do FixIt está em preparação.</p>
      <section className={styles.connection} aria-labelledby="connection-title">
        <h2 id="connection-title">Conexão</h2>
        <p data-connection-status={connection.status}>{connection.message}</p>
        <form action="/" method="get"><button type="submit">Verificar novamente</button></form>
      </section>
    </main>
  );
}
