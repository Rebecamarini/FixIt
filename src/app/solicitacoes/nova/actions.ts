'use server';
import { listarContas } from '../../../server/admin-accounts.ts';
import { createSessionClient } from '../../../server/session.ts';
import { obterIdentidade } from '../../../server/identity.ts';

export async function consultarCategorias() {
  try {
    const client = await createSessionClient();
    if (!await obterIdentidade(client)) return { items: [], error: 'Sua sessão terminou. Entre novamente.' };
    const { data, error } = await client.from('categorias').select('id,nome').order('nome');
    if (error) throw error;
    return { items: data as { id: string; nome: string }[], error: '' };
  } catch { return { items: [], error: 'Não foi possível consultar as categorias.' }; }
}

export async function buscarSolicitantes(q: string, page: number) {
  try {
    if (typeof q !== 'string' || !Number.isSafeInteger(page) || page < 1) throw new Error();
    const result = await listarContas(await createSessionClient(), { q, page });
    if (result.forbidden) return { items: [], total: 0, page: 1, error: 'Você não tem permissão para consultar outras contas.' };
    return { items: result.items, total: result.total, page: result.page, error: '' };
  } catch { return { items: [], total: 0, page: 1, error: 'Não foi possível consultar os solicitantes.' }; }
}
