import { PaginaAlteracaoBem, type PropsAlteracaoBem } from '../mutation-page';
export const dynamic = 'force-dynamic';
export default async function ArquivarBem(props: PropsAlteracaoBem) {
  return <PaginaAlteracaoBem {...props} acao="arquivar" />;
}
