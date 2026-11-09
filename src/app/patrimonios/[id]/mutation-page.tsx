import Link from 'next/link';
import { obterIdentidade } from '../../../server/identity.ts';
import { createSessionClient } from '../../../server/session.ts';
import { alterarBem, obterBemParaEdicao } from '../../../server/asset-mutation.ts';
import { consultaBens, listaBensUrl, parametrosBens, type ConsultaBens } from '../../../lib/asset-navigation.ts';
import { TelaPatrimonio, ErroConsulta } from '../ui';
import FormularioAlteracaoBem from './mutation-form';

export type PropsAlteracaoBem = { params: Promise<{ id: string }>; searchParams: Promise<ConsultaBens> };

export async function PaginaAlteracaoBem({ params, searchParams, acao }: PropsAlteracaoBem & { acao: 'editar' | 'arquivar' }) {
  const { id } = await params;
  const { busca, pagina } = consultaBens(await searchParams);
  const contexto = parametrosBens(busca, pagina);
  const voltar = `/patrimonios/${encodeURIComponent(id)}?${contexto}`;
  const repetir = `/patrimonios/${encodeURIComponent(id)}/${acao}?${contexto}`;
  let identidade, resultado;
  try {
    const client = await createSessionClient();
    identidade = await obterIdentidade(client);
    resultado = await obterBemParaEdicao(client, id);
  } catch { return <ErroConsulta erro="falha_consulta" voltar={repetir} />; }
  if (resultado.erro === 'nao_encontrado') return <TelaPatrimonio titulo="Bem não encontrado"><p>O bem não está disponível para alteração.</p><Link href={listaBensUrl(busca, pagina)}>Voltar à lista</Link></TelaPatrimonio>;
  if (!resultado.data || !identidade) return <ErroAlteracao erro={resultado.erro ?? 'nao_autenticado'} repetir={repetir} />;
  const autor = identidade.id;
  async function enviar(dados: unknown, versao: number, tentativa: string) {
    'use server';
    return alterarBem(await createSessionClient(), { id, acao, dados, versao, tentativa, identidade: autor });
  }
  return <TelaPatrimonio titulo={acao === 'editar' ? 'Editar bem patrimonial' : 'Arquivar bem patrimonial'}>
    <FormularioAlteracaoBem bem={resultado.data} acao={acao} enviar={enviar} voltar={voltar} lista={listaBensUrl(busca, pagina)} />
  </TelaPatrimonio>;
}

function ErroAlteracao({ erro, repetir }: { erro: string; repetir: string }) {
  if (erro !== 'nao_autorizado') return <ErroConsulta erro={erro} voltar={repetir} />;
  return <TelaPatrimonio titulo="Acesso restrito"><p role="alert">Somente Gestor autorizado pode editar ou arquivar bens.</p><Link href="/patrimonios">Voltar à consulta</Link></TelaPatrimonio>;
}
