import 'server-only';
import { criarSolicitacao, type ResultadoCriacao } from './requests.ts';
import { createSessionClient } from './session.ts';
import { obterIdentidade } from './identity.ts';
import { camposSolicitacao, errosPreenchimento, type Preenchimento, type ErrosPreenchimento } from '../lib/request-draft.ts';

export type EnvioSolicitacao = {
  message?: string;
  retry?: boolean;
  errors?: ErrosPreenchimento;
  confirmation?: {
    id: string; estado: 'Pendente'; representacao: boolean;
    solicitante: string; autor: string; repetida: boolean;
  };
};

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const uncertainResult = { message: 'Não foi possível confirmar o envio. A solicitação pode estar registrada. Use Enviar novamente.', retry: true };

function preenchimentoValido(input: unknown): input is Record<string, unknown> & { modalidade: string; solicitante_id: string } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return false;
  const raw = input as Record<string, unknown>;
  if (Object.keys(raw).some(key => !camposSolicitacao.some(([field]) => field === key) && !['modalidade', 'solicitante_id'].includes(key))) return false;
  if (camposSolicitacao.some(([key]) => typeof raw[key] !== 'string')) return false;
  if (!['proprio', 'outro'].includes(raw.modalidade as string) || typeof raw.solicitante_id !== 'string') return false;
  return raw.modalidade !== 'proprio' || raw.solicitante_id === '';
}

function validarCampos(values: Preenchimento, raw: { modalidade: string; solicitante_id: string }) {
  const errors = errosPreenchimento(values);
  if (values.categoria_id && !uuid.test(values.categoria_id)) errors.categoria_id = 'Selecione uma categoria cadastrada.';
  if (raw.modalidade === 'outro' && !uuid.test(raw.solicitante_id)) errors.solicitante_id = 'Selecione uma conta ativa.';
  return errors;
}

function resultadoEnvio(result: ResultadoCriacao): EnvioSolicitacao {
  if (result.data) return { confirmation: {
    id: result.data.id, estado: result.data.estado,
    representacao: result.data.solicitante_id !== result.data.autor_id,
    solicitante: result.solicitante_nome!, autor: result.autor_nome!, repetida: !!result.ja_registrada,
  } };
  if (result.erro === 'solicitante_indisponivel') return { errors: { solicitante_id: 'Selecione uma conta ativa. A conta escolhida pode ter sido excluída.' }, message: 'Confira o solicitante.' };
  if (result.erro === 'categoria_indisponivel') return { errors: { categoria_id: 'Selecione uma categoria cadastrada.' }, message: 'Confira a categoria.' };
  if (result.erro === 'resultado_incerto') return uncertainResult;
  if (result.erro === 'nao_autenticado' || result.erro === 'nao_autorizado') return { message: 'Sua sessão mudou ou terminou. Entre novamente com a mesma conta em outra aba.', retry: true };
  return { message: 'Não foi possível gravar a solicitação. Confira os dados e tente novamente.' };
}

// The page identity binds the preserved attempt even if another account signs in.
export async function enviarSolicitacao(input: unknown, tentativa: string, identidadeEsperada: string): Promise<EnvioSolicitacao> {
  try {
    const client = await createSessionClient();
    const identity = await obterIdentidade(client);
    if (!identity) return { message: 'Sua sessão terminou. Entre novamente em outra aba e use Enviar novamente.', retry: true };
    if (identity.id !== identidadeEsperada) return { message: 'Entre novamente com a conta que abriu este formulário.', retry: true };
    if (!preenchimentoValido(input)) return { message: 'Preenchimento inválido.' };
    if (identity.papel !== 'Gestor' && input.modalidade !== 'proprio') return { message: 'Você só pode solicitar em nome próprio.' };
    const values = Object.fromEntries(camposSolicitacao.map(([key]) => [key, (input[key] as string).trim()])) as Preenchimento;
    if (!uuid.test(tentativa)) return { message: 'Tentativa inválida.' };
    const errors = validarCampos(values, input);
    if (Object.keys(errors).length) return { errors, message: 'Confira os campos indicados.' };
    const normalized = Object.fromEntries(camposSolicitacao.map(([key, , required]) => [key, !required && !values[key] ? null : values[key]]));
    const result = await criarSolicitacao(client, normalized, tentativa,
      input.modalidade === 'outro' ? input.solicitante_id : undefined, identidadeEsperada);
    return resultadoEnvio(result);
  } catch { return uncertainResult; }
}
