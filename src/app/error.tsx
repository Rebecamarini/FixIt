"use client";
import Link from "next/link";
export default function ErrorPage({ retry }: { error: unknown; retry: () => void }) {
  return <main><h1>Não foi possível carregar o FixIt</h1><p role="alert">Verifique a conexão e tente novamente.</p><button type="button" onClick={retry}>Tentar novamente</button><p><Link href="/conta/entrar">Ir para o login</Link></p></main>;
}
