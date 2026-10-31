import Link from "next/link";
import { redirect } from "next/navigation";
import { obterIdentidade } from "../../../server/identity.ts";
import { createSessionClient } from "../../../server/session.ts";
import { AccountForm } from "../form";
import styles from "../form.module.css";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ cadastro?: string }> }) {
  let authenticated = false;
  let unavailable = false;
  try { authenticated = Boolean(await obterIdentidade(await createSessionClient())); }
  catch { unavailable = true; }
  if (authenticated) redirect("/");
  const params = await searchParams;
  return <main className={styles.page}>
    <Link href="/">FixIt</Link>
    <section className={styles.card} aria-labelledby="login-title">
      <h1 id="login-title">Entrar</h1>
      {params.cadastro === "concluido" && <p role="status" className={styles.success}>Conta criada com sucesso. Entre com seu e-mail e senha.</p>}
      {unavailable ? <p role="alert">Não foi possível acessar o FixIt. Tente novamente em instantes.</p> : <AccountForm />}
    </section>
  </main>;
}
