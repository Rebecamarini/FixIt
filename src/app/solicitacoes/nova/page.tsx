
import { enviarSolicitacao } from "../../../server/request-submission.ts";
import FormularioSolicitacao from "./form";
import { redirect } from "next/navigation";
import { obterIdentidade } from "../../../server/identity.ts";
import { createSessionClient } from "../../../server/session.ts";

import Sidebar from "../../../components/cliente/Sidebar";
import Header from "../../../components/cliente/Header";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function NovaSolicitacaoPage() {
  const identidade = await obterIdentidade(
    await createSessionClient()
  );

  if (!identidade) {
    redirect("/conta/entrar");
  }

  const autorId = identidade.id;

  async function enviar(input: unknown, tentativa: string) {
    "use server";
    return enviarSolicitacao(input, tentativa, autorId);
  }

  const client = await createSessionClient();

  const { data: perfil } = await client
    .from("perfis")
    .select("nome")
    .eq("id", identidade.id)
    .single();

  const nome = perfil?.nome || "Usuário";

  return (
    <div className={styles.container}>
      <Sidebar />

      <div className={styles.principal}>
        <Header nome={nome} />

        <main className={styles.conteudo}>
          <p className={styles.subtitulo}>
            FixIt / MVP acadêmico
          </p>

          <h1>Abrir chamado</h1>

          <p className={styles.descricao}>
            Informe o problema identificado.
            O gestor avaliará o atendimento.
          </p>

          <FormularioSolicitacao
            papel={identidade.papel}
            enviar={enviar}
          />
        </main>
      </div>
    </div>
  );
}
