// Régua de cor por faixa de meta batida — exclusiva do lado de Vendas
// (docs/portal-vendedor/plano-portal-vendedor.md, seção 4.1). Antes
// duplicada (com nomes diferentes) em VendorCard.tsx e meu-dashboard/page.tsx.
// Reinicia junto com o progresso a cada 100%.
export function corPorMetaBatida(percMeta: number): string {
  if (percMeta <= 100) return 'var(--blue)';
  if (percMeta <= 200) return 'var(--green)';
  if (percMeta <= 300) return 'var(--orange)';
  if (percMeta <= 400) return 'var(--pink)';
  return 'var(--gold)';
}
