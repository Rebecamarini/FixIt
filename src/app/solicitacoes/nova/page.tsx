
import { enviarSolicitacao } from "../../../server/request-submission.ts";
import FormularioSolicitacao from "./form";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { obterIdentidade } from "../../../server/identity.ts";
import { createSessionClient } from "../../../server/session.ts";

import ClienteLayout from "../../../components/cliente/ClienteLayout";
import Link from "next/link";

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
    const resultado = await enviarSolicitacao(input, tentativa, autorId);
    if (resultado.confirmation) {
      revalidatePath("/");
      revalidatePath("/solicitacoes");
    }
    return resultado;
  }

  const client = await createSessionClient();

  const { data: perfil, error: erroPerfil } = await client
    .from("perfis")
    .select("nome")
    .eq("id", identidade.id)
    .single();

  if (erroPerfil || !perfil) throw new Error("Não foi possível carregar sua conta.");
  const nome = perfil.nome;

  const conteudo = <>
    <h1>Abrir chamado</h1>
    <p className={styles.descricao}>Informe o problema identificado. O gestor avaliará o atendimento.</p>
    <FormularioSolicitacao papel={identidade.papel} enviar={enviar} />
  </>;
  if (identidade.papel === "Cliente") return <ClienteLayout nome={nome}>{conteudo}</ClienteLayout>;
  return <main className={styles.conteudo}><Link href="/">Voltar ao início</Link>{conteudo}</main>;
}
