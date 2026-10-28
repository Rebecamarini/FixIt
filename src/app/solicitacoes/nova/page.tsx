import { enviarSolicitacao } from "../../../server/request-submission.ts";
import FormularioSolicitacao from "./form";
import { redirect } from "next/navigation";
import { obterIdentidade } from "../../../server/identity.ts";
import { createSessionClient } from "../../../server/session.ts";
import styles from "../../page.module.css";

export const dynamic = "force-dynamic";

export default async function NovaSolicitacaoPage() {
  const identidade = await obterIdentidade(await createSessionClient());
  if (!identidade) redirect("/conta/entrar");

  const autorId = identidade.id;
  async function enviar(input: unknown, tentativa: string) {
    'use server';
    return enviarSolicitacao(input, tentativa, autorId);
  }

  return (
    <main className={styles.main}>
      <p className={styles.brand}>FixIt</p>
      <h1>Nova solicitação de manutenção</h1>
      <p>Inicie aqui um pedido de manutenção para informar um problema que precisa de atendimento.</p>
      <FormularioSolicitacao papel={identidade.papel} enviar={enviar} />
    </main>
  );
}
