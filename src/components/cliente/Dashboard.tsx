import Link from "next/link";
import { carregarConta, carregarResumos, carregarLinhas } from "../../server/client-view";
import ClienteLayout from "./ClienteLayout";
import Cards from "./Cards";
import TabelaChamados from "./TabelaChamados";
import styles from "./ClienteLayout.module.css";

export default async function Dashboard() {
  const { client, nome } = await carregarConta();
  const itens = await carregarResumos(client);
  const linhas = await carregarLinhas(client, itens.slice(0, 5), nome);
  const indicadores = [
    { titulo: "Total", valor: itens.length, icone: "▤" },
    ...[["Pendentes", "Pendente", "◷"], ["Em atendimento", "Em atendimento", "⚙"], ["Concluídos", "Concluída", "✓"]].map(([titulo, estado, icone]) => ({ titulo, icone, valor: itens.filter(item => String(item.estado) === estado).length })),
  ];
  return <ClienteLayout nome={nome}>
    <div className={styles.boasVindas}>
      <div><span className={styles.eyebrow}>FixIt</span><h1>Olá, {nome}!</h1><p>Acompanhe as solicitações de manutenção que você abriu.</p></div>
      <Link className={styles.novoChamado} href="/solicitacoes/nova">＋ Novo chamado</Link>
    </div>
    <div className={styles.indicadores}>{indicadores.map(item => <Cards key={item.titulo} {...item} />)}</div>
    <TabelaChamados chamados={linhas} />
  </ClienteLayout>;
}
