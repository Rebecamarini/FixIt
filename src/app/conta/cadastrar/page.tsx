import Link from "next/link";
import { redirect } from "next/navigation";
import { createSessionClient } from "../../../server/session.ts";
import { obterIdentidade } from "../../../server/identity.ts";
import { AccountForm } from "../form";
import styles from "../form.module.css";

export const dynamic = "force-dynamic";

export default async function CadastroPage() {
  let authenticated = false;
  let unavailable = false;
  try {
    const client = await createSessionClient();
    authenticated = Boolean(await obterIdentidade(client));
  } catch { unavailable = true; }
  if (authenticated) redirect("/");
  return <main className={styles.page}>
    <Link href="/">FixIt</Link>
    <section className={styles.card} aria-labelledby="cadastro-title">
      <h1 id="cadastro-title">Criar conta</h1>
      <p>Cadastre-se para solicitar e acompanhar manutenções. Todos os campos são obrigatórios.</p>
      {unavailable ? <p role="alert">Não foi possível carregar o cadastro. Tente novamente em instantes.</p> : <AccountForm cadastro />}
    </section>
  </main>;
}
