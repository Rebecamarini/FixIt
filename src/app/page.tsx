import { checkConnection } from "../server/connection";
import Link from "next/link";
import type { ReactNode } from "react";
import { createSessionClient } from "../server/session";
import { obterIdentidade } from "../server/identity";
import { LogoutForm } from "./conta/form";
import styles from "./page.module.css";
import Sidebar from "../components/cliente/Sidebar";
import Cards from "../components/cliente/Cards";

export const dynamic = "force-dynamic";

function HomeLayout({ cliente, children }: { cliente: boolean; children: ReactNode }) {
  return (
    <div className={cliente ? styles.clientLayout : undefined}>
      {cliente && <Sidebar />}
      {children}
    </div>
  );
}

export default async function Home() {
  const connection = await checkConnection();
  let nome: string | null = null;
  let cliente = false;
  let gestor = false;
  let consultaPatrimonio = false;
  let sessionError = false;
  try {
    const client = await createSessionClient();
    const identidade = await obterIdentidade(client);
    if (identidade) {
      gestor = identidade.papel === "Gestor";
      consultaPatrimonio = gestor || identidade.papel === "Manutentor";
      const profile = await client.from("perfis").select("nome").eq("id", identidade.id).single();
      if (profile.error) throw profile.error;
      nome = profile.data.nome;
      cliente = identidade.papel === "Cliente";
    }
  } catch { sessionError = true; }

  return (
    <HomeLayout cliente={cliente}>
      <main className={styles.main}>
        <p className={styles.brand}>FixIt</p>
        <h1>Gestão de manutenção</h1>
        {sessionError ? <p role="alert">Não foi possível verificar sua sessão. Tente novamente em instantes.</p> : nome ? <section aria-label="Sua conta">
          <p>Olá, {nome}!</p>
          <p>Você entrou no FixIt.</p>
          {cliente && <Cards titulo="Solicitações" valor={0} icone="📋" />}
          <p><Link href="/solicitacoes/nova">Nova solicitação</Link></p>
          <p><Link href="/conta/perfil">Meu perfil</Link></p>
          {gestor && <>
            <p><Link href="/usuarios">Gerenciar usuários</Link></p>
            <p><Link href="/patrimonios/novo">Cadastrar bem</Link></p>
          </>}
          {consultaPatrimonio && <p><Link href="/patrimonios">Consultar bens</Link></p>}
          <LogoutForm />
        </section> : <nav aria-label="Acesso"><Link href="/conta/entrar">Entrar</Link>{" · "}<Link href="/conta/cadastrar">Criar conta</Link></nav>}
        <section className={styles.connection} aria-labelledby="connection-title">
          <h2 id="connection-title">Conexão</h2>
          <p data-connection-status={connection.status}>{connection.message}</p>
          <form action="/" method="get"><button type="submit">Verificar novamente</button></form>
        </section>
      </main>
    </HomeLayout>
  );
}
