import Link from "next/link";
import { redirect } from "next/navigation";
import { createSessionClient } from "../../../server/session.ts";
import { obterIdentidade } from "../../../server/identity.ts";
import { CreateAccountForm } from "./form";
import styles from "../../conta/form.module.css";

export const dynamic = "force-dynamic";

export default async function NovaContaPage() {
  let identity;
  try { identity = await obterIdentidade(await createSessionClient()); }
  catch {
    return <main className={styles.page}><h1>Criar usuário</h1><p role="alert">Não foi possível verificar sua sessão. Tente novamente em instantes.</p><Link href="/usuarios">Voltar à gestão</Link></main>;
  }
  if (identity?.papel !== "Gestor") redirect("/");
  return <main className={styles.page}>
    <Link href="/usuarios">Voltar à gestão</Link>
    <section className={styles.card}><h1>Criar usuário</h1>
      <p>Informe os dados da conta e defina uma senha inicial para entregar ao titular fora do FixIt.</p>
      <CreateAccountForm />
    </section>
  </main>;
}
