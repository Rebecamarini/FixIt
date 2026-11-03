"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import type { AdminState } from "../../../server/admin-accounts.ts";
import { criar, conferir } from "../actions";
import styles from "../../conta/form.module.css";

function accountFieldError(state: AdminState, name: string) {
  return state.errors?.[name] ? <span id={`${name}-error`} className={styles.error}>{state.errors[name]}</span> : null;
}

function accountFieldValidity(state: AdminState, name: string) {
  return { "aria-invalid": Boolean(state.errors?.[name]), "aria-describedby": state.errors?.[name] ? `${name}-error` : undefined };
}

function AccountDetails({ state }: { state: AdminState }) {
  return <>
    <div><label htmlFor="nome">Nome</label><input id="nome" name="nome" required readOnly={Boolean(state.creationId)} autoComplete="name" defaultValue={state.values?.nome ?? ""} {...accountFieldValidity(state, "nome")} />{accountFieldError(state, "nome")}</div>
    <div><label htmlFor="email">E-mail</label><input id="email" name="email" type="email" required readOnly={Boolean(state.creationId)} autoComplete="email" defaultValue={state.values?.email ?? ""} {...accountFieldValidity(state, "email")} />{accountFieldError(state, "email")}</div>
    <div><label htmlFor="papel">Papel</label><select key={state.values?.papel ?? ""} id="papel" name="papel" required disabled={Boolean(state.creationId)} defaultValue={state.values?.papel ?? ""} {...accountFieldValidity(state, "papel")}><option value="">Selecione o papel</option><option>Manutentor</option><option>Gestor</option></select>{accountFieldError(state, "papel")}</div>
  </>;
}

export function CreateAccountForm() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [state, action, pending] = useActionState(async (_previous: AdminState, form: FormData) => {
    setPassword("");
    return (_previous.creationId ? conferir : criar)(_previous, form);
  }, {});
  return <form action={action} noValidate className={styles.form} aria-busy={pending}>
    {state.message && <p role="alert" className={styles.error}>{state.message}</p>}
    {state.creationId && <input type="hidden" name="criacao_id" value={state.creationId} />}
    <AccountDetails state={state} />
    {!state.creationId && <div><label htmlFor="senha">Senha inicial (mínimo de 8 caracteres)</label><input id="senha" name="senha" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={8} value={password} onChange={event => setPassword(event.target.value)} {...accountFieldValidity(state, "senha")} />{accountFieldError(state, "senha")}<label className={styles.checkbox}><input type="checkbox" checked={showPassword} onChange={event => setShowPassword(event.target.checked)} /> Mostrar senha</label></div>}
    <button type="submit" disabled={pending}>{pending ? "Aguarde…" : state.creationId ? "Conferir criação" : "Criar conta"}</button>
    <Link href="/usuarios" aria-disabled={pending} onClick={event => { if (pending) event.preventDefault(); else { setPassword(""); setShowPassword(false); } }}>Cancelar</Link>
  </form>;
}
