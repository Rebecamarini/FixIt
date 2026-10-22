"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { AccountState } from "../../server/account.ts";
import { cadastrar, entrar, sair } from "./actions";
import styles from "./form.module.css";

export function AccountForm({ cadastro = false, setores = [] }: {
  cadastro?: boolean;
  setores?: { id: string; nome: string }[];
}) {
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [state, action, pending] = useActionState(async (previous: AccountState, data: FormData) => {
    setSenha("");
    return (cadastro ? cadastrar : entrar)(previous, data);
  }, {});
  const fieldError = (name: string) => state.errors?.[name] ? <span id={`${name}-error`} className={styles.error}>{state.errors[name]}</span> : null;
  const invalid = (name: string) => ({ "aria-invalid": Boolean(state.errors?.[name]), "aria-describedby": state.errors?.[name] ? `${name}-error` : undefined });

  return (
    <form action={action} className={styles.form} aria-busy={pending}>
      {state.message && <p role="alert" className={styles.error}>{state.message}</p>}
      {cadastro && <div>
        <label htmlFor="nome">Nome</label>
        <input id="nome" name="nome" autoComplete="name" required defaultValue={state.values?.nome ?? ""} {...invalid("nome")} />
        {fieldError("nome")}
      </div>}
      <div>
        <label htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" autoComplete="email" required defaultValue={state.values?.email ?? ""} {...invalid("email")} />
        {fieldError("email")}
      </div>
      <div>
        <label htmlFor="senha">Senha{cadastro && " (mínimo de 8 caracteres)"}</label>
        <input id="senha" name="senha" type={mostrarSenha ? "text" : "password"} autoComplete={cadastro ? "new-password" : "current-password"} required minLength={cadastro ? 8 : undefined} value={senha} onChange={event => setSenha(event.target.value)} {...invalid("senha")} />
        {fieldError("senha")}
        <label className={styles.checkbox}><input type="checkbox" checked={mostrarSenha} onChange={event => setMostrarSenha(event.target.checked)} /> Mostrar senha</label>
      </div>
      {cadastro && <>
        <div>
          <label htmlFor="matricula">Matrícula</label>
          <input id="matricula" name="matricula" type="text" required defaultValue={state.values?.matricula ?? ""} {...invalid("matricula")} />
          {fieldError("matricula")}
        </div>
        <div>
          <label htmlFor="setor_id">Setor</label>
          <select key={state.values?.setor_id ?? ""} id="setor_id" name="setor_id" required defaultValue={state.values?.setor_id ?? ""} {...invalid("setor_id")}>
            <option value="">Selecione seu setor</option>
            {setores.map(setor => <option key={setor.id} value={setor.id}>{setor.nome}</option>)}
          </select>
          {fieldError("setor_id")}
        </div>
      </>}
      <button type="submit" disabled={pending}>{pending ? "Aguarde…" : cadastro ? "Criar conta" : "Entrar"}</button>
      <p>{cadastro ? <>Já tem conta? <Link href="/conta/entrar">Entrar</Link></> : <>Ainda não tem conta? <Link href="/conta/cadastrar">Criar conta</Link></>}</p>
    </form>
  );
}

export function LogoutForm() {
  const [state, action, pending] = useActionState(sair, {});
  return <form action={action} className={styles.form}>
    {state.message && <p role="alert" className={styles.error}>{state.message}</p>}
    <button type="submit" disabled={pending}>{pending ? "Saindo…" : "Sair"}</button>
  </form>;
}
