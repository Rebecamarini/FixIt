import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { obterIdentidade } from './identity.ts';
import { obterBem, type DetalhesBem } from './asset-query.ts';
import { normalizarBem, errosBem, type ErrosBem } from '../lib/asset-form.ts';

export type BemEditavel = DetalhesBem;
export type EntradaAlteracaoBem = { id: string; versao: number; acao: 'editar' | 'arquivar'; dados?: unknown; tentativa: string; identidade: string };
export type ResultadoAlteracaoBem = {
  status?: 'salvo' | 'arquivado' | 'sem_alteracoes' | 'conflito' | 'ja_arquivado' | 'nao_encontrado';
  bem?: BemEditavel; repetida?: boolean; errors?: ErrosBem; message?: string; retry?: boolean; denied?: boolean;
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const denied: ResultadoAlteracaoBem = { denied: true, retry: true, message: 'Sua sessão mudou ou terminou. Entre novamente com a mesma conta de Gestor em outra aba.' };
const uncertain: ResultadoAlteracaoBem = { retry: true, message: 'Não foi possível confirmar a alteração. Ela pode ter sido concluída. Confira ou repita a mesma tentativa.' };

export async function obterBemParaEdicao(client: SupabaseClient, id: string): ReturnType<typeof obterBem> {
  try {
    const identity = await obterIdentidade(client);
    if (!identity) return { data: null, erro: 'nao_autenticado' };
    if (identity.papel !== 'Gestor') return { data: null, erro: 'nao_autorizado' };
    return await obterBem(client, id);
  } catch { return { data: null, erro: 'falha_consulta' }; }
}

async function persistir(client: SupabaseClient, input: EntradaAlteracaoBem, dados: unknown): Promise<ResultadoAlteracaoBem> {
  const { data, error } = await client.rpc('us027_alterar_bem', {
    alvo: input.id, versao_esperada: input.versao, acao: input.acao, dados,
    tentativa: input.tentativa, identidade: input.identidade,
  });
  if (error?.code === '42501') return denied;
  if (error && ['22023', '23514', '23502', '22007', '22008', '22P02'].includes(error.code)) return { message: 'Confira os dados e as datas informadas.' };
  return error || !data ? uncertain : data;
}

function tentativaValida(input: EntradaAlteracaoBem) {
  return uuid.test(input.id) && uuid.test(input.tentativa) && Number.isSafeInteger(input.versao)
    && input.versao >= 1 && ['editar', 'arquivar'].includes(input.acao);
}

export async function alterarBem(client: SupabaseClient, input: EntradaAlteracaoBem): Promise<ResultadoAlteracaoBem> {
  try {
    const identity = await obterIdentidade(client);
    if (!identity || identity.papel !== 'Gestor' || identity.id !== input.identidade) return denied;
    if (!tentativaValida(input)) return { message: 'Tentativa de alteração inválida.' };
    let dados = null;
    if (input.acao === 'editar') {
      dados = normalizarBem(input.dados);
      if (!dados) return { message: 'Preenchimento inválido.' };
      const errors = errosBem(dados);
      if (Object.keys(errors).length) return { errors, message: 'Confira os campos indicados.' };
    }
    return await persistir(client, input, dados);
  } catch { return uncertain; }
}
