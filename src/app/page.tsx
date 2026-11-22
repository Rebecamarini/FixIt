import Link from "next/link";
import { checkConnection } from "../server/connection";
import { carregarConta } from "../server/client-view";
import { LogoutForm } from "./conta/form";
import Dashboard from "../components/cliente/Dashboard";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { identidade, nome } = await carregarConta();
  if (identidade.papel === "Cliente") return <Dashboard />;
  const connection = await checkConnection();
  const gestor = identidade.papel === "Gestor";
  return <main className={styles.main}>
    <p className={styles.brand}>FixIt</p><h1>Gestão de manutenção</h1>
    <section aria-label="Sua conta">
      <p>Olá, {nome}!</p><p>Você entrou no FixIt.</p>
      <p><Link href="/solicitacoes/nova">Nova solicitação</Link></p>
      <p><Link href="/conta/perfil">Meu perfil</Link></p>
      {gestor && <><p><Link href="/usuarios">Gerenciar usuários</Link></p><p><Link href="/patrimonios/novo">Cadastrar bem</Link></p></>}
      <p><Link href="/patrimonios">Consultar bens</Link></p>
      <LogoutForm />
    </section>
    <section className={styles.connection} aria-labelledby="connection-title">
      <h2 id="connection-title">Conexão</h2><p data-connection-status={connection.status}>{connection.message}</p>
      <form action="/" method="get"><button type="submit">Verificar novamente</button></form>
    </section>
  </main>;
}
