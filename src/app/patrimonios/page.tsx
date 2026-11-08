import type { Metadata } from 'next';
import Link from 'next/link';
import { createSessionClient } from '../../server/session';
import { listarBens } from '../../server/asset-query';
import { consultaBens, listaBensUrl, parametrosBens, type ConsultaBens } from '../../lib/asset-navigation';
import { TelaPatrimonio, ErroConsulta } from './ui';
import styles from './page.module.css';

export const metadata: Metadata = { title: 'Consultar bens | FixIt' };
export const dynamic = 'force-dynamic';

export default async function ConsultarBens({ searchParams }: { searchParams: Promise<ConsultaBens> }) {
  const { busca, pagina } = consultaBens(await searchParams);
  const voltar = listaBensUrl(busca, pagina);
  let resultado;
  try { resultado = await listarBens(await createSessionClient(), busca, pagina); }
  catch { return <ErroConsulta erro="falha_consulta" voltar={voltar} />; }
  if (!resultado.data) return <ErroConsulta erro={resultado.erro ?? 'falha_consulta'} voltar={voltar} />;
  const { itens, total, pagina: atual } = resultado.data;
  const paginas = Math.max(1, Math.ceil(total / 10));
  return <TelaPatrimonio titulo="Consultar bens">
    <form action="/patrimonios" method="get" className={styles.search}>
      <label htmlFor="busca">Pesquisar por código</label>
      <div><input id="busca" name="busca" defaultValue={busca} placeholder="Código ou trecho do código" /><button type="submit">Pesquisar</button></div>
    </form>
    <p role="status">{total} {total === 1 ? 'bem encontrado' : 'bens encontrados'}</p>
    {total === 0 ? <p>{busca ? 'Nenhum bem encontrado' : 'Nenhum bem ativo cadastrado'}</p> : <ul className={styles.list} aria-label="Bens patrimoniais">
      {itens.map(bem => <li className={styles.card} key={bem.id}>
        <h2>{bem.codigo}</h2><p>{bem.descricao}</p>
        <dl><div><dt>Localização</dt><dd>{bem.localizacao}</dd></div><div><dt>Estado de conservação</dt><dd>{bem.estado_conservacao}</dd></div></dl>
        <Link href={`/patrimonios/${bem.id}?${parametrosBens(busca, atual)}`}>Abrir detalhes</Link>
      </li>)}
    </ul>}
    {total > 0 && <nav className={styles.pagination} aria-label="Paginação dos bens">
      {atual > 1 ? <Link href={listaBensUrl(busca, atual - 1)}>Anterior</Link> : <span>Anterior</span>}
      {Array.from({ length: paginas }, (_, i) => i + 1).map(p => p === atual
        ? <span key={p} aria-current="page">{p}</span>
        : <Link key={p} href={listaBensUrl(busca, p)} aria-label={`Página ${p}`}>{p}</Link>)}
      {atual < paginas ? <Link href={listaBensUrl(busca, atual + 1)}>Próxima</Link> : <span>Próxima</span>}
      <p>Página {atual} de {paginas}</p>
    </nav>}
    <p><Link href="/">Voltar ao início</Link></p>
  </TelaPatrimonio>;
}
