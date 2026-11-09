import type { Metadata } from 'next';
import Link from 'next/link';
import { obterIdentidade } from '../../../server/identity';
import { createSessionClient } from '../../../server/session';
import { obterBem } from '../../../server/asset-query';
import { consultaBens, listaBensUrl, parametrosBens, type ConsultaBens } from '../../../lib/asset-navigation';
import { TelaPatrimonio, ErroConsulta, AvisoResultado } from '../ui';
import styles from '../page.module.css';

export const metadata: Metadata = { title: 'Detalhes do bem | FixIt' };
export const dynamic = 'force-dynamic';

function dataExibida(data: string | null) {
  return data ? data.split('-').reverse().join('/') : 'Não informado';
}

export default async function DetalhesDoBem({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<ConsultaBens & { resultado?: string | string[] }> }) {
  const { id } = await params;
  const consulta = await searchParams;
  const { busca, pagina } = consultaBens(consulta);
  const voltar = listaBensUrl(busca, pagina);
  const repetir = `/patrimonios/${encodeURIComponent(id)}?${parametrosBens(busca, pagina)}`;
  let resultado, identidade;
  try {
    const client = await createSessionClient();
    identidade = await obterIdentidade(client);
    resultado = await obterBem(client, id);
  }
  catch { return <ErroConsulta erro="falha_consulta" voltar={repetir} />; }
  if (resultado.erro === 'nao_encontrado') return <TelaPatrimonio titulo="Bem não encontrado"><p>O bem não está disponível para consulta.</p><Link href={voltar}>Voltar à lista</Link></TelaPatrimonio>;
  if (!resultado.data) return <ErroConsulta erro={resultado.erro ?? 'falha_consulta'} voltar={repetir} />;
  const bem = resultado.data;
  const campos = [
    ['Código patrimonial', bem.codigo], ['Descrição', bem.descricao], ['Localização', bem.localizacao],
    ['Estado de conservação', bem.estado_conservacao], ['Marca', bem.marca ?? 'Não informado'],
    ['Modelo', bem.modelo ?? 'Não informado'], ['Data de aquisição', dataExibida(bem.data_aquisicao)],
    ['Término da garantia', dataExibida(bem.garantia_ate)],
  ];
  return <TelaPatrimonio titulo="Detalhes do bem">
    <AvisoResultado resultado={consulta.resultado} />
    <dl className={styles.card}>{campos.map(([nome, valor]) => <div key={nome}><dt>{nome}</dt><dd>{valor}</dd></div>)}</dl>
    {identidade?.papel === 'Gestor' && <nav className={styles.pagination} aria-label="Ações do bem">
      <Link href={`/patrimonios/${bem.id}/editar?${parametrosBens(busca, pagina)}`}>Editar</Link>
      <Link href={`/patrimonios/${bem.id}/arquivar?${parametrosBens(busca, pagina)}`}>Arquivar</Link>
    </nav>}
    <Link href={voltar}>Voltar à lista</Link>
  </TelaPatrimonio>;
}
