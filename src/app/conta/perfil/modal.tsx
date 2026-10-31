"use client";
import { useEffect, useRef, useState } from "react";
import type { ProfileState } from "../../../server/profile.ts";
import { salvarEmail, salvarSenha, encerrar } from "./actions";
import styles from "../form.module.css";
import modalStyles from "./modal.module.css";

export function CredentialModal({ kind, onClose, onResult }: {
  kind: "email" | "senha"; onClose: () => void; onResult: (result: ProfileState) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const errorMessage = useRef<HTMLParagraphElement>(null);
  const [values, setValues] = useState({ email: "", senha_atual: "", nova_senha: "", confirmar_senha: "" });
  const [state, setState] = useState<ProfileState>({});
  const [busy, setBusy] = useState(false);
  const dirty = Object.values(values).some(Boolean);
  useEffect(() => {
    const element = dialog.current!;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    element.showModal();
    return () => { element.close(); opener?.focus(); };
  }, []);
  useEffect(() => { errorMessage.current?.focus(); }, [state]);
  function close() {
    if (!busy && (!dirty || window.confirm("Descartar o conteúdo deste modal? Cancele para continuar editando."))) onClose();
  }
  function field(name: keyof typeof values, label: string) {
    const error = state.errors?.[name];
    return <div><label htmlFor={`modal-${name}`}>{label}</label><input id={`modal-${name}`} name={name} type={name === "email" ? "email" : "password"} autoComplete={name === "email" ? "email" : name === "senha_atual" ? "current-password" : "new-password"} value={values[name]} onChange={event => setValues({ ...values, [name]: event.target.value })} aria-invalid={Boolean(error)} aria-describedby={error ? `modal-${name}-error` : undefined} />
      {error && <span id={`modal-${name}-error`} className={styles.error}>{error}</span>}</div>;
  }
  return <dialog ref={dialog} className={modalStyles.dialog} aria-labelledby="credential-title" onKeyDown={event => {
    if (event.key !== "Tab") return;
    const fields = Array.from(dialog.current!.querySelectorAll<HTMLElement>('input:not(:disabled), button:not(:disabled)'));
    const first = fields[0], last = fields.at(-1);
    if (event.shiftKey && (document.activeElement === first || !fields.includes(document.activeElement as HTMLElement))) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || !fields.includes(document.activeElement as HTMLElement))) { event.preventDefault(); first?.focus(); }
  }} onCancel={event => { event.preventDefault(); close(); }}>
    <h2 id="credential-title">{kind === "email" ? "Alterar e-mail" : "Alterar senha"}</h2>
    {kind === "email" ? <p>O novo endereço será usado no próximo login. Suas sessões serão mantidas.</p> : <p>A nova senha deve ter pelo menos 8 caracteres e ser diferente da atual. A sessão atual será mantida; outras sessões deixarão de renovar, mas acessos já emitidos podem durar até expirar.</p>}
    {state.message && <p role="alert" tabIndex={-1} ref={errorMessage}>{state.message}</p>}
    <form className={styles.form} noValidate aria-busy={busy} onSubmit={async event => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      setBusy(true);
      setValues(current => ({ ...current, senha_atual: "", nova_senha: "", confirmar_senha: "" }));
      try {
        const result = state.partial ? await encerrar() : await (kind === "email" ? salvarEmail : salvarSenha)(data);
        setState(result);
        if (result.sessionLost) { onResult(result); onClose(); }
        else if (result.success) { onResult(result); onClose(); }
      } catch { setState({ partial: state.partial, message: state.partial ? "Não foi possível confirmar o encerramento. Tente novamente somente o encerramento." : "Não foi possível confirmar a gravação. Confira os dados atuais antes de repetir." }); }
      finally { setBusy(false); }
    }}>
      <fieldset disabled={busy} className={styles.form} style={{ border: 0, padding: 0, margin: 0 }}>
        {!state.partial && <>{kind === "email" && field("email", "Novo e-mail")}{field("senha_atual", "Senha atual")}{kind === "senha" && <>{field("nova_senha", "Nova senha")}{field("confirmar_senha", "Confirmar nova senha")}</>}</>}
        <button type="submit">{busy ? "Aguarde…" : state.partial ? "Tentar encerrar outras sessões" : "Confirmar alteração"}</button>
        <button type="button" onClick={close}>Cancelar</button>
      </fieldset>
    </form>
  </dialog>;
}
