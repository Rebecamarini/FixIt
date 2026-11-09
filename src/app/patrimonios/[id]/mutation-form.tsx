'use client';
import { useRef } from 'react';
import Link from 'next/link';
import { camposBem, type PreenchimentoBem } from '../../../lib/asset-form.ts';
import type { BemEditavel, ResultadoAlteracaoBem } from '../../../server/asset-mutation.ts';
import { CamposBem } from '../fields';
import { useMutationForm, type EnviarAlteracao } from './use-mutation-form';
import styles from '../../solicitacoes/nova/form.module.css';
import assetStyles from '../novo/form.module.css';
import mutationStyles from './mutation.module.css';

type State = ReturnType<typeof useMutationForm>;
type Props = { bem: BemEditavel; acao: 'editar' | 'arquivar'; enviar: EnviarAlteracao; voltar: string; lista: string };
const messages = {
  salvo: 'Alterações salvas.', arquivado: 'Bem arquivado.', sem_alteracoes: 'Não há alterações para salvar.',
  conflito: 'O bem mudou desde sua conferência. Compare os dados e abra a versão atual antes de continuar.',
  ja_arquivado: 'O bem já foi arquivado por outro Gestor.', nao_encontrado: 'O bem não está disponível para alteração.',
};
function destino(result: ResultadoAlteracaoBem, voltar: string, lista: string) {
  if (result.status === 'sem_alteracoes' && result.repetida) return `${voltar}&resultado=sem_alteracoes_recuperado`;
  if (result.status === 'salvo') return `${voltar}&resultado=${result.repetida ? 'salvo_recuperado' : 'salvo'}`;
  if (result.status === 'arquivado') return `${lista}&resultado=${result.repetida ? 'arquivado_recuperado' : 'arquivado'}`;
  if (result.status === 'ja_arquivado') return `${lista}&resultado=ja_arquivado`;
  return null;
}

export default function FormularioAlteracaoBem({ bem, acao, enviar, voltar, lista }: Props) {
  const state = useMutationForm(bem, enviar);
  const form = useRef<HTMLFormElement>(null);
  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await state.submit();
    if (!response) return;
    requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
    const url = destino(response, voltar, lista);
    if (url) state.navigate(url);
  }
  return <form ref={form} onSubmit={send} noValidate className={`${styles.form} ${assetStyles.form}`}>
    <p>Código patrimonial: <strong>{bem.codigo}</strong></p>
    <DadosAlteracao state={state} acao={acao} />
    {state.comparison && <Comparacao state={state} acao={acao} />}
    <ControlesAlteracao state={state} acao={acao} voltar={voltar} lista={lista} />
  </form>;
}

function DadosAlteracao({ state, acao }: { state: State; acao: Props['acao'] }) {
  const blocked = state.busy || !!state.result.retry || !!state.result.denied || state.result.status === 'conflito' || state.result.status === 'nao_encontrado';
  if (acao === 'arquivar') return <AvisoArquivamento bem={state.base} />;
  return <fieldset disabled={blocked}><legend>Dados do bem</legend><CamposBem values={state.values} errors={state.result.errors} change={state.change} /></fieldset>;
}

function rotuloEnvio(state: State, acao: Props['acao']) {
  if (state.busy) return 'Enviando…';
  if (state.result.retry) return 'Conferir resultado';
  return acao === 'editar' ? 'Salvar alterações' : 'Arquivar bem';
}

function ControlesAlteracao({ state, acao, voltar, lista }: { state: State; acao: Props['acao']; voltar: string; lista: string }) {
  const unavailable = state.result.status === 'nao_encontrado';
  return <>
    {!unavailable && <button type="submit" disabled={state.busy || state.result.status === 'conflito'}>{rotuloEnvio(state, acao)}</button>}
    <p role="status">{state.result.message || (state.result.status && messages[state.result.status])}</p>
    {state.result.retry && <p>O resultado pode ter sido concluído. Os dados desta tentativa estão preservados. Se sua sessão mudou, <a href="/conta/entrar" target="_blank" rel="noopener noreferrer">entre com a mesma conta de Gestor em outra aba</a> e confira o resultado.</p>}
    <CancelarAlteracao state={state} voltar={unavailable ? lista : voltar} unavailable={unavailable} />
  </>;
}

function CancelarAlteracao({ state, voltar, unavailable }: { state: State; voltar: string; unavailable: boolean }) {
  if (state.busy || state.result.retry) return null;
  return <Link href={voltar} onNavigate={event => {
    if (state.dirty && !window.confirm('Descartar alterações? Os dados não serão salvos.')) event.preventDefault();
  }}>{unavailable ? 'Voltar à lista' : 'Cancelar'}</Link>;
}

function AvisoArquivamento({ bem }: { bem: BemEditavel }) {
  return <section aria-label="Confirmação de arquivamento"><h2>Conferir bem</h2>
    <p><strong>{bem.codigo}</strong> — {bem.descricao}</p>
    <p>O bem sairá da consulta de bens ativos. Seus dados e vínculos serão preservados; solicitações abertas não serão encerradas. Não há restauração nesta entrega.</p>
  </section>;
}

function Comparacao({ state, acao }: { state: State; acao: Props['acao'] }) {
  const comparison = state.comparison!;
  return <section aria-label="Comparação das alterações">
    <h2>Conferir alterações de outro Gestor</h2>
    <div className={mutationStyles.comparison}><table><caption>Seu preenchimento e os dados atuais na conferência do conflito</caption>
      <thead><tr><th scope="col">Campo</th><th scope="col">Seu preenchimento</th><th scope="col">Dados atuais</th></tr></thead>
      <tbody>{camposBem.map(([key, label]) => <tr key={key}><th scope="row">{label}</th><td>{exibir(key, comparison.local[key])}</td><td>{exibir(key, comparison.current[key])}</td></tr>)}</tbody>
    </table></div>
    {state.result.status === 'conflito' ? <button type="button" onClick={state.review}>{acao === 'editar' ? 'Abrir versão atual para editar' : 'Conferir versão atual para arquivar'}</button>
      : <p>A versão conferida está carregada. {acao === 'editar' ? 'Reaplique manualmente as mudanças desejadas no formulário e salve.' : 'Confira o bem acima e confirme novamente para arquivar.'} Se houver outra alteração, será necessária nova revisão.</p>}
  </section>;
}
function exibir(key: keyof PreenchimentoBem, value: string | null) {
  if (!value) return 'Não informado';
  return key === 'data_aquisicao' || key === 'garantia_ate' ? value.split('-').reverse().join('/') : value;
}
