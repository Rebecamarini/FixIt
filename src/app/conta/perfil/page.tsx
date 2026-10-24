import Link from "next/link";
import { redirect } from "next/navigation";
import { createSessionClient } from "../../../server/session.ts";
import { consultarPerfil } from "../../../server/profile.ts";
import { ProfileForm } from "./form";
import styles from "../form.module.css";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  let perfil;
  let setores: { id: string; nome: string }[] = [];
  try {
    const client = await createSessionClient();
    perfil = await consultarPerfil(client);
    if (perfil) {
      const result = await client.from("setores").select("id,nome").order("nome");
      if (result.error) throw result.error;
      setores = result.data;
    }
  } catch {
    return <main className={styles.page}><h1>Meu perfil</h1><p role="alert">Não foi possível carregar seu perfil. Tente recarregar em instantes.</p><Link href="/">Voltar</Link></main>;
  }
  if (!perfil) redirect("/conta/entrar?sessao=encerrada");
  return <main className={styles.page}><p>FixIt</p><section className={styles.card}><h1>Meu perfil</h1><ProfileForm perfil={perfil} setores={setores} /></section></main>;
}
