import Link from "next/link";
import { redirect } from "next/navigation";
import { createSessionClient } from "../../server/session.ts";
import { listarContas } from "../../server/admin-accounts.ts";
import { AccountTable } from "./table";
import styles from "../page.module.css";
import userStyles from "./usuarios.module.css";

export const dynamic = "force-dynamic";

export default async function UsuariosPage({ searchParams }: { searchParams: Promise<{ q?: string; papel?: string; pagina?: string; criada?: string }> }) {
  const params = await searchParams;
  let result;
  try {
    result = await listarContas(await createSessionClient(), { q: params.q, papel: params.papel, page: Number(params.pagina) || 1 });
  } catch {
    return <main className={styles.main}><h1>Gerenciar usuários</h1><p role="alert">Não foi possível carregar as contas. Tente novamente em instantes.</p><Link href="/">Voltar</Link></main>;
  }
  if (result.forbidden) redirect("/");
  const pages = Math.max(1, Math.ceil(result.total / 20));
  const href = (page: number) => `/usuarios?${new URLSearchParams({ ...(params.q ? { q: params.q } : {}), ...(params.papel ? { papel: params.papel } : {}), pagina: String(page) })}`;
  return <main className={styles.main}>
    <p className={styles.brand}>FixIt</p><h1>Gerenciar usuários</h1>
    <p><Link href="/">Voltar à página inicial</Link></p>
    {params.criada && <p role="status">Conta criada com sucesso.</p>}
    <p><Link href="/usuarios/nova">Criar usuário</Link></p>
    <form action="/usuarios" method="get" aria-label="Buscar usuários" className={userStyles.filters}>
      <label>Nome ou e-mail <input name="q" type="search" defaultValue={params.q} /></label>
      <label>Papel <select name="papel" defaultValue={params.papel ?? ""}><option value="">Todos</option><option>Cliente</option><option>Manutentor</option><option>Gestor</option></select></label>
      <button type="submit">Buscar</button>
    </form>
    <p>{result.total ? `${result.total} usuário(s)` : params.q || params.papel ? "Nenhum usuário encontrado." : "Ainda não há usuários ativos."}</p>
    <AccountTable items={result.items} ownId={result.ownId} />
    {result.total > 0 && <>
      <nav aria-label="Paginação" className={userStyles.pagination}>
        {result.page > 1 && <Link href={href(result.page - 1)}>Anterior</Link>}
        <span>Página {result.page} de {pages}</span>
        {result.page < pages && <Link href={href(result.page + 1)}>Próxima</Link>}
      </nav>
    </>}
  </main>;
}
