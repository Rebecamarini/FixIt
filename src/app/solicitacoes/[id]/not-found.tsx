import Link from "next/link";
export default function SolicitacaoNaoEncontrada() {
  return <main><h1>Solicitação não encontrada</h1><p>Não foi possível encontrar esta solicitação entre seus pedidos.</p><Link href="/solicitacoes">Voltar para Meus chamados</Link></main>;
}
