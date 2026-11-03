import { redirect } from "next/navigation";
import { createSessionClient } from "../../../server/session.ts";
import { consultarPerfil, profileErrorMessage, type Perfil } from "../../../server/profile.ts";
import { ProfilePanel } from "./panel";
import styles from "../form.module.css";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  let perfil: Perfil | null = null;
  let loadError;
  try {
    const client = await createSessionClient();
    perfil = await consultarPerfil(client);
  } catch (error) {
    loadError = profileErrorMessage(error, "Não foi possível carregar seu perfil. Tente recarregar em instantes.");
  }
  if (!loadError && !perfil) redirect("/conta/entrar?sessao=encerrada");
  return <main className={styles.page}><p>FixIt</p><section className={styles.card}><h1>Meu perfil</h1><ProfilePanel perfil={perfil} loadError={loadError} /></section></main>;
}
