import type { Metadata } from 'next';
import Link from 'next/link';
import { createSessionClient } from '../../../server/session';
import { obterBem } from '../../../server/asset-query';
import { consultaBens, listaBensUrl, parametrosBens, type ConsultaBens } from '../../../lib/asset-navigation';
import { TelaPatrimonio, ErroConsulta } from '../ui';
import styles from '../page.module.css';

export const metadata: Metadata = { title: 'Detalhes do bem | FixIt' };
export const dynamic = 'force-dynamic';

function dataExibida(data: string | null) {
  return data ? data.split('-').reverse().join('/') : 'Não informado';
}

export default async function DetalhesDoBem({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<ConsultaBens> }) {
  const { id } = await params;
  const { busca, pagina } = consultaBens(await searchParams);
  const voltar = listaBensUrl(busca, pagina);
  const repetir = `/patrimonios/${encodeURIComponent(id)}?${parametrosBens(busca, pagina)}`;
  let resultado;
  try { resultado = await obterBem(await createSessionClient(), id); }
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
    <dl className={styles.card}>{campos.map(([nome, valor]) => <div key={nome}><dt>{nome}</dt><dd>{valor}</dd></div>)}</dl>
    <Link href={voltar}>Voltar à lista</Link>
  </TelaPatrimonio>;
}
