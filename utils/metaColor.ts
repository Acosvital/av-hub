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

// Mesma régua acima, mas como marcos (1 por faixa de 100%) — base das
// "medalhas" de meta batida em Meu Dashboard: cada marco fica "conquistado"
// quando `perc_meta` já passou daquele patamar.
export interface MarcoMetaProps {
  limite: number;
  cor: string;
  label: string;
}

export const MARCOS_META: MarcoMetaProps[] = [
  { limite: 100, cor: 'var(--blue)', label: '100%' },
  { limite: 200, cor: 'var(--green)', label: '200%' },
  { limite: 300, cor: 'var(--orange)', label: '300%' },
  { limite: 400, cor: 'var(--pink)', label: '400%' },
  { limite: 500, cor: 'var(--gold)', label: '500%' },
];
