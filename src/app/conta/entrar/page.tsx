import Link from "next/link";
import { redirect } from "next/navigation";
import { obterIdentidade } from "../../../server/identity.ts";
import { createSessionClient } from "../../../server/session.ts";
import { AccountForm } from "../form";
import styles from "../form.module.css";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ cadastro?: string; sessao?: string }> }) {
  let authenticated = false;
  let unavailable = false;
  try { authenticated = Boolean(await obterIdentidade(await createSessionClient())); }
  catch { unavailable = true; }
  if (authenticated) redirect("/");
  const params = await searchParams;
  
return (
  <main className={styles.loginPage}>
    <section
      className={styles.loginCard}
      aria-labelledby="login-title"
    >
      <Link href="/" className={styles.logo}>
        <span className={styles.logoIcon}>✚</span>
        <span>FixIt</span>
      </Link>

      <h1 id="login-title">Bem-vindo de volta!</h1>

      <p className={styles.subtitulo}>
        Faça login na sua conta para continuar.
      </p>

      {params.cadastro === "concluido" && (
        <p role="status" className={styles.success}>
          Conta criada com sucesso. Entre com seu e-mail e senha.
        </p>
      )}

      {params.sessao === "encerrada" && (
        <p role="alert">
          Sua sessão terminou. Entre novamente.
          As alterações não enviadas foram descartadas.
        </p>
      )}

      {unavailable ? (
        <p role="alert">
          Não foi possível acessar o FixIt.
          Tente novamente em instantes.
        </p>
      ) : (
        <AccountForm />
      )}
    </section>
  </main>
  );  
  }
