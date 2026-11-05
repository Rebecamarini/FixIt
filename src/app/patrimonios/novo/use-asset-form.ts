'use client';
import { useEffect, useRef, useState } from 'react';
import { preenchimentoBemInicial, type PreenchimentoBem, type ErrosBem } from '../../../lib/asset-form.ts';
import type { ResultadoBem } from '../../../server/assets.ts';

type Enviar = (input: unknown, tentativa: string) => Promise<ResultadoBem>;

function useSubmission(enviar: Enviar, values: PreenchimentoBem) {
  const submit = useRef(enviar);
  const attempt = useRef<{ id: string; values: PreenchimentoBem } | null>(null);
  const pending = useRef(false);
  const focusPending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ResultadoBem>({});
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!busy && focusPending.current) {
      focusPending.current = false;
      form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    }
  }, [busy, result]);
  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true; setBusy(true);
    attempt.current ??= { id: crypto.randomUUID(), values: { ...values } };
    try {
      const response = await submit.current(attempt.current.values, attempt.current.id);
      setResult(response);
      if (!response.retry) attempt.current = null;
    } catch {
      setResult({ retry: true, message: 'Não foi possível confirmar o cadastro. O bem pode estar registrado. Use Conferir cadastro.' });
    } finally { pending.current = false; focusPending.current = true; setBusy(false); }
  }
  function resetSubmission() { attempt.current = null; setResult({}); }
  return { busy, result, setResult, send, resetSubmission, form };
}

export function useAssetForm(enviar: Enviar) {
  const [values, setValues] = useState<PreenchimentoBem>(preenchimentoBemInicial);
  const submission = useSubmission(enviar, values);
  const form = submission.form;
  const dirty = !submission.result.confirmation && Object.values(values).some(Boolean);
  useEffect(() => {
    if (!dirty) return;
    function warn(event: BeforeUnloadEvent) { event.preventDefault(); event.returnValue = ''; }
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  function change(key: keyof PreenchimentoBem, value: string) {
    setValues(current => ({ ...current, [key]: value }));
    submission.setResult(current => ({ errors: { ...current.errors, [key]: undefined } as ErrosBem }));
  }
  function reset() {
    setValues(preenchimentoBemInicial); submission.resetSubmission();
    requestAnimationFrame(() => form.current?.querySelector<HTMLTextAreaElement>('textarea')?.focus());
  }
  return { ...submission, values, change, reset, form, dirty };
}
