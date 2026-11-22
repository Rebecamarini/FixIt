import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { carregarConta } from "../../../server/client-view";
import { obterSolicitacao, obterHistoricoSolicitacao, type EventoSolicitacao } from "../../../server/requests";
import ClienteLayout from "../../../components/cliente/ClienteLayout";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";
function Data({ valor }: { valor: string }) {
  return <time dateTime={valor}>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(valor))}</time>;
}

export default async function DetalhesSolicitacao({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { client, identidade, nome } = await carregarConta();
  if (identidade.papel !== "Cliente") return <main><h1>Acesso restrito</h1><Link href="/">Voltar ao início</Link></main>;
  const resultado = await obterSolicitacao(client, id);
  if (resultado.erro === "nao_autenticado") redirect("/conta/entrar");
  if (["nao_encontrado", "dados_invalidos"].includes(resultado.erro ?? "")) notFound();
  if (!resultado.data) throw new Error("Não foi possível carregar a solicitação.");
  const chamado = resultado.data;
  const historico = await obterHistoricoSolicitacao(client, id);
  if (historico.erro === "nao_autenticado") redirect("/conta/entrar");
  const categoria = await client.from("categorias").select("nome").eq("id", chamado.categoria_id).single();
  const observacoes = [["Motivo", chamado.motivo], ["Pessoas e áreas afetadas", chamado.pessoas_areas_afetadas], ["Frequência", chamado.frequencia], ["Tipo de utilização", chamado.tipo_utilizacao], ["Riscos", chamado.riscos], ["Patrimônios afetados", chamado.patrimonios_afetados]];
  return <ClienteLayout nome={nome}>
    <Link className={styles.voltar} href="/solicitacoes">← Voltar para Meus chamados</Link><h1>Detalhes do chamado</h1>
    <section className={styles.card} aria-labelledby="titulo-chamado">
      <header className={styles.cabecalho}><div><p className={styles.numero}>Chamado #{chamado.id}</p><h2 id="titulo-chamado">{chamado.assunto}</h2></div><span className={`${styles.status} ${styles.pendente}`}>{chamado.estado}</span></header>
      <dl className={styles.informacoes}>
        <div><dt>Data de abertura</dt><dd><Data valor={chamado.criado_em} /></dd></div><div><dt>Solicitante</dt><dd>{nome}</dd></div><div><dt>Categoria</dt><dd>{categoria.error ? "Não foi possível carregar a categoria." : categoria.data.nome}</dd></div><div><dt>Localização</dt><dd>{chamado.local}</dd></div>
        <div><dt>Prioridade</dt><dd>Não disponível</dd></div><div><dt>Manutentor responsável</dt><dd>Não disponível</dd></div>
        <div className={styles.linhaInteira}><dt>Bem patrimonial vinculado</dt><dd>Vínculo formal não disponível</dd></div>
      </dl>
      <div className={styles.descricao}><h3>Descrição do problema</h3><p>{chamado.descricao}</p></div>
      {observacoes.map(([titulo, valor]) => valor && <div key={titulo} className={styles.descricao}><h3>{titulo}</h3><p>{valor}</p></div>)}
    </section>
    <Historico eventos={historico.data} erro={!!historico.erro} nome={nome} usuarioId={identidade.id} />
  </ClienteLayout>;
}

function Historico({ eventos, erro, nome, usuarioId }: { eventos: EventoSolicitacao[] | null; erro: boolean; nome: string; usuarioId: string }) {
  return <section className={styles.card} aria-labelledby="titulo-historico">
    <header className={styles.cabecalho}><div><h2 id="titulo-historico">Histórico de acompanhamento</h2><p>Atualizações em ordem cronológica</p></div></header>
    {erro ? <p role="alert">Não foi possível carregar o histórico. Atualize a página para tentar novamente.</p>
      : !eventos?.length ? <p>Nenhum evento disponível.</p>
      : <ol className={styles.historico}>{eventos.map(evento => <li key={evento.id}>
        <div className={styles.eventoCabecalho}><h3>{evento.estado_anterior ? `${evento.estado_anterior} → ${evento.estado_novo}` : "Solicitação registrada"}</h3><Data valor={evento.criado_em} /></div>
        <p className={styles.autor}>Autor: {evento.autor_id === usuarioId ? nome : evento.autor_id}</p><p>{evento.descricao}</p>
      </li>)}</ol>}
  </section>;
}
