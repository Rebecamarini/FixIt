'use server';
import { listarContas, contaAtivaParaSolicitacao } from '../../../server/admin-accounts.ts';
import { createSessionClient } from '../../../server/session.ts';
import { obterIdentidade } from '../../../server/identity.ts';
import { camposSolicitacao, errosPreenchimento, type Preenchimento, type ErrosPreenchimento, type CampoSolicitacao } from '../../../lib/request-draft.ts';

export async function consultarCategorias() {
  try {
    const client = await createSessionClient();
    if (!await obterIdentidade(client)) return { items: [], error: 'Sua sessão terminou. Entre novamente.' };
    const { data, error } = await client.from('categorias').select('id,nome').order('nome');
    if (error) throw error;
    return { items: data as { id: string; nome: string }[], error: '' };
  } catch { return { items: [], error: 'Não foi possível consultar as categorias.' }; }
}

export async function validarPreenchimento(input: unknown): Promise<{ errors?: ErrosPreenchimento; message?: string; values?: Record<CampoSolicitacao, string | null> }> {
  try {
    const client = await createSessionClient();
    const identity = await obterIdentidade(client);
    if (!identity) return { message: 'Sua sessão terminou. Entre novamente.' };
    if (!input || typeof input !== 'object' || Array.isArray(input)) return { message: 'Preenchimento inválido.' };
    const raw = input as Record<string, unknown>;
    if (Object.keys(raw).some(key => !camposSolicitacao.some(([field]) => field === key) && !['modalidade', 'solicitante_id'].includes(key)) || camposSolicitacao.some(([key]) => typeof raw[key] !== 'string')) return { message: 'Preenchimento inválido.' };
    if (typeof raw.modalidade !== 'string' || !['proprio', 'outro'].includes(raw.modalidade) || typeof raw.solicitante_id !== 'string') return { message: 'Preenchimento inválido.' };
    if ((identity.papel !== 'Gestor' && raw.modalidade !== 'proprio') || (raw.modalidade === 'proprio' && raw.solicitante_id !== '')) return { message: 'Você só pode solicitar em nome próprio.' };
    const values = Object.fromEntries(camposSolicitacao.map(([key]) => [key, (raw[key] as string).trim()])) as Preenchimento;
    const errors = errosPreenchimento(values);
    if (raw.modalidade === 'outro') {
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw.solicitante_id as string) || !await contaAtivaParaSolicitacao(client, raw.solicitante_id as string)) errors.solicitante_id = 'Selecione uma conta ativa. A conta escolhida pode ter sido excluída.';
    }
    if (values.categoria_id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(values.categoria_id)) errors.categoria_id = 'Selecione uma categoria cadastrada.';
    else if (values.categoria_id) {
      const { data, error } = await client.from('categorias').select('id').eq('id', values.categoria_id).maybeSingle();
      if (error) return { message: 'Não foi possível conferir a categoria. Tente novamente.' };
      if (!data) errors.categoria_id = 'Selecione uma categoria cadastrada.';
    }
    const normalized = Object.fromEntries(camposSolicitacao.map(([key, , required]) => [key, !required && !values[key] ? null : values[key]])) as Record<CampoSolicitacao, string | null>;
    return { values: normalized, errors };
  } catch { return { message: 'Não foi possível validar. Tente novamente.' }; }
}

export async function buscarSolicitantes(q: string, page: number) {
  try {
    if (typeof q !== 'string' || !Number.isSafeInteger(page) || page < 1) throw new Error();
    const result = await listarContas(await createSessionClient(), { q, page });
    if (result.forbidden) return { items: [], total: 0, page: 1, error: 'Você não tem permissão para consultar outras contas.' };
    return { items: result.items, total: result.total, page: result.page, error: '' };
  } catch { return { items: [], total: 0, page: 1, error: 'Não foi possível consultar os solicitantes.' }; }
}
