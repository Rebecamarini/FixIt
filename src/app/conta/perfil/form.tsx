"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Perfil, ProfileState } from "../../../server/profile.ts";
import { CredentialModal } from "./modal";
import { salvar } from "./actions";
import styles from "../form.module.css";

export function ProfileForm({ perfil }: { perfil: Perfil }) {
  const router = useRouter();
  const [values, setValues] = useState({ nome: perfil.nome });
  const [email, setEmail] = useState(perfil.email);
  const [modal, setModal] = useState<"email" | "senha" | null>(null);
  const [saved, setSaved] = useState(values);
  const [state, setState] = useState<ProfileState>({});
  const [busy, setBusy] = useState(false);
  const dirty = Object.keys(values).some(key => values[key as keyof typeof values] !== saved[key as keyof typeof saved]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function sessionLost(result: ProfileState) {
    if (result.sessionLost) { router.replace("/conta/entrar?sessao=encerrada"); return true; }
    return false;
  }
  function field(name: keyof typeof values, label: string) {
    const error = state.errors?.[name];
    return <div><label htmlFor={name}>{label}</label><input id={name} name={name} type="text" value={values[name]} onChange={e => setValues({ ...values, [name]: e.target.value })} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} />
    {error && <span className={styles.error} id={`${name}-error`}>{error}</span>}</div>;
  }
  return <>
    <p style={{ overflowWrap: "anywhere" }}>E-mail atual: {email}</p><p>Papel: {perfil.papel}</p>
    <div className={styles.form}><button type="button" disabled={busy} onClick={() => setModal("email")}>Alterar e-mail</button><button type="button" disabled={busy} onClick={() => setModal("senha")}>Alterar senha</button></div>
    {modal && <CredentialModal kind={modal} onClose={() => setModal(null)} onResult={result => { if (sessionLost(result)) return; if (result.email) setEmail(result.email); setState(result); }} />}
    {state.message && <p role={state.success ? "status" : "alert"}>{state.message}</p>}
    <form className={styles.form} onSubmit={async event => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      setBusy(true);
      try {
        const result = await salvar(data);
        if (sessionLost(result)) return;
        setState(result);
        if (result.perfil) {
          const next = { nome: result.perfil.nome };
          setValues(next); setSaved(next);
        }
      } catch { setState({ message: "Não foi possível confirmar a gravação. Confira os dados atuais antes de repetir." }); }
      finally { setBusy(false); }
    }} aria-busy={busy}>
      <fieldset disabled={busy} className={styles.form} style={{ border: 0, padding: 0, margin: 0 }}>
        {field("nome", "Nome")}
        <button type="submit">{busy ? "Salvando…" : "Salvar perfil"}</button>
        <button type="button" onClick={() => { if (!dirty || window.confirm("Descartar alterações do perfil? Cancele para continuar editando.")) router.push("/"); }}>Voltar</button>
      </fieldset>
    </form>
  </>;
}
