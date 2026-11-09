'use client';
import { useEffect, useRef, useState } from 'react';
import { camposBem, type PreenchimentoBem } from '../../../lib/asset-form.ts';
import type { BemEditavel, ResultadoAlteracaoBem } from '../../../server/asset-mutation.ts';

export type EnviarAlteracao = (dados: unknown, versao: number, tentativa: string) => Promise<ResultadoAlteracaoBem>;
function valoresDoBem(bem: BemEditavel): PreenchimentoBem {
  return Object.fromEntries(camposBem.map(([key]) => [key, bem[key] ?? ''])) as PreenchimentoBem;
}
function mesmosValores(a: PreenchimentoBem, b: PreenchimentoBem) {
  return camposBem.every(([key]) => a[key].trim() === b[key].trim());
}

function useTentativa(enviar: EnviarAlteracao) {
  const action = useRef(enviar);
  const attempt = useRef<{ id: string; values: PreenchimentoBem; versao: number } | null>(null);
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ResultadoAlteracaoBem>({});
  async function execute(values: PreenchimentoBem, versao: number) {
    if (pending.current) return null;
    pending.current = true; setBusy(true);
    attempt.current ??= { id: crypto.randomUUID(), values: { ...values }, versao };
    let response: ResultadoAlteracaoBem;
    try { response = await action.current(attempt.current.values, attempt.current.versao, attempt.current.id); }
    catch { response = { retry: true, message: 'Não foi possível confirmar a alteração. Ela pode ter sido concluída. Use Conferir resultado para recuperar esta tentativa.' }; }
    setResult(response);
    if (!response.retry) attempt.current = null;
    pending.current = false; setBusy(false);
    return response;
  }
  return { busy, result, setResult, execute };
}

export function useMutationForm(bem: BemEditavel, enviar: EnviarAlteracao) {
  const [base, setBase] = useState(bem);
  const [values, setValues] = useState(() => valoresDoBem(bem));
  const [comparison, setComparison] = useState<{ local: PreenchimentoBem; current: BemEditavel } | null>(null);
  const submission = useTentativa(enviar);
  const leaving = useRef(false);
  const dirty = !mesmosValores(values, valoresDoBem(base)) || !!submission.result.retry;
  useEffect(() => {
    if (!dirty) return;
    function warn(event: BeforeUnloadEvent) { if (!leaving.current) { event.preventDefault(); event.returnValue = ''; } }
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  async function submit() {
    const response = await submission.execute(values, base.versao);
    if (response?.status === 'conflito' && response.bem) setComparison({ local: { ...values }, current: response.bem });
    return response;
  }
  function change(key: keyof PreenchimentoBem, value: string) {
    setValues(current => ({ ...current, [key]: value }));
    submission.setResult(current => ({ errors: { ...current.errors, [key]: undefined } }));
  }
  function review() {
    if (!comparison) return;
    setBase(comparison.current); setValues(valoresDoBem(comparison.current)); submission.setResult({});
  }
  function navigate(url: string) { leaving.current = true; window.location.assign(url); }
  return { ...submission, values, base, dirty, comparison, change, review, submit, navigate };
}
