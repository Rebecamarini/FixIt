import Link from "next/link";
import { redirect } from "next/navigation";
import { createSessionClient } from "../../../server/session.ts";
import { consultarPerfil } from "../../../server/profile.ts";
import { ProfileForm } from "./form";
import styles from "../form.module.css";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  let perfil;
  try {
    const client = await createSessionClient();
    perfil = await consultarPerfil(client);
  } catch {
    return <main className={styles.page}><h1>Meu perfil</h1><p role="alert">Não foi possível carregar seu perfil. Tente recarregar em instantes.</p><Link href="/">Voltar</Link></main>;
  }
  if (!perfil) redirect("/conta/entrar?sessao=encerrada");
  return <main className={styles.page}><p>FixIt</p><section className={styles.card}><h1>Meu perfil</h1><ProfileForm perfil={perfil} /></section></main>;
}
