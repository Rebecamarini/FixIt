import { PaginaAlteracaoBem, type PropsAlteracaoBem } from '../mutation-page';
export const dynamic = 'force-dynamic';
export default async function EditarBem(props: PropsAlteracaoBem) {
  return <PaginaAlteracaoBem {...props} acao="editar" />;
}
