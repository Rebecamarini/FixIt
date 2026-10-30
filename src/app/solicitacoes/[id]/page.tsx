import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSessionClient } from "../../../server/session";
import { obterDetalheSolicitacao } from "../../../server/request-details";
import { DetalhesSolicitacao } from "./detalhes";
import styles from "../page.module.css";

export const metadata: Metadata = { title: "Detalhes da solicitação | FixIt" };
export const dynamic = "force-dynamic";

export default async function DetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resultado = await obterDetalheSolicitacao(await createSessionClient(), id);
  if (resultado.erro === "nao_encontrado" || resultado.erro === "dados_invalidos" || resultado.erro === "nao_autorizado") notFound();
  if (resultado.erro === "nao_autenticado") {
    return <main className={styles.main}><section className={styles.empty}>
      <h1>Sessão necessária</h1><p>Entre no FixIt para consultar suas solicitações.</p>
      <Link href="/solicitacoes">Voltar para minhas solicitações</Link>
    </section></main>;
  }
  if (!resultado.data) throw new Error("Não foi possível consultar a solicitação.");
  return <DetalhesSolicitacao detalhe={resultado.data} />;
}
