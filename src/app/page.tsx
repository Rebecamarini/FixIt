import { checkConnection } from "../server/connection";
import Link from "next/link";
import { createSessionClient } from "../server/session";
import { obterIdentidade } from "../server/identity";
import { LogoutForm } from "./conta/form";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function Home() {
  const connection = await checkConnection();
  let nome: string | null = null;
  let sessionError = false;
  try {
    const client = await createSessionClient();
    const identidade = await obterIdentidade(client);
    if (identidade) {
      const profile = await client.from("perfis").select("nome").eq("id", identidade.id).single();
      if (profile.error) throw profile.error;
      nome = profile.data.nome;
    }
  } catch { sessionError = true; }

  return (
    <main className={styles.main}>
      <p className={styles.brand}>FixIt</p>
      <h1>Gestão de manutenção</h1>
      {sessionError ? <p role="alert">Não foi possível verificar sua sessão. Tente novamente em instantes.</p> : nome ? <section aria-label="Sua conta">
        <p>Olá, {nome}!</p>
        <p>Você entrou no FixIt.</p>
        <LogoutForm />
      </section> : <nav aria-label="Acesso"><Link href="/conta/entrar">Entrar</Link>{" · "}<Link href="/conta/cadastrar">Criar conta</Link></nav>}
      <section className={styles.connection} aria-labelledby="connection-title">
        <h2 id="connection-title">Conexão</h2>
        <p data-connection-status={connection.status}>{connection.message}</p>
        <form action="/" method="get"><button type="submit">Verificar novamente</button></form>
      </section>
    </main>
  );
}
