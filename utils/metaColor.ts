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

// Trilha de progresso "rumo ao próximo marco" — substitui a lista de 5
// medalhas sempre visíveis por uma barra só, mostrando o quanto já foi
// andado dentro da faixa de 100% atual (ex.: 245% = 45% andado rumo aos
// 300%). Acima de 500% (último marco), a trilha fica cheia e parada —
// não tem "próximo" pra apontar.
export interface TrilhaMetaProps {
  baseAnterior: number;
  limite: number;
  fracao: number;
  cor: string;
  completo: boolean;
}

export function trilhaMeta(percMeta: number): TrilhaMetaProps {
  const ultimoIdx = MARCOS_META.length - 1;
  const idx = Math.min(Math.floor(Math.max(percMeta, 0) / 100), ultimoIdx);
  const marco = MARCOS_META[idx];
  const baseAnterior = idx * 100;
  const completo = idx === ultimoIdx && percMeta >= marco.limite;
  const fracao = completo ? 1 : Math.min(1, Math.max(0, (percMeta - baseAnterior) / 100));
  return { baseAnterior, limite: marco.limite, fracao, cor: marco.cor, completo };
}
