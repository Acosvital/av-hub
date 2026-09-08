// Fonte única pra classificação de grupo (G1-G6) de pedidos/notas fiscais —
// antes duplicado em meus-pedidos/page.tsx e minhas-notas/page.tsx. Mesmo
// desenho de cascata de vw_nf_classified — ver
// docs/portal-vendedor/plano-portal-vendedor.md, seção 4.2.1. LIQUIDO não
// ganha badge (pedido/nota normal).
export const GRUPO_LABEL_PEDIDO: Record<string, string> = {
  G1: 'Cancelado',
  G2: 'Devolvido',
  G3: 'Recusado',
  G4: 'Bloqueado',
  G5: 'Bloqueado',
  G6: 'Refaturamento',
};

export const GRUPO_COLOR_PEDIDO: Record<string, string> = {
  G1: 'var(--graphite)',
  G2: 'var(--orange)',
  G3: 'var(--red)',
  G4: 'var(--graphite)',
  G5: 'var(--graphite)',
  G6: 'var(--pink)',
};

// Definições usadas nos cards de situação dos dashboards por tipo
// (dash-vendas-por-tipo / dash-faturamento-por-tipo) — paleta e rótulos
// próprios desses dashboards, diferentes da paleta acima usada no Portal do
// Vendedor (meus-pedidos/minhas-notas). Mantidos separados de propósito: são
// públicos distintos (dashboard gerencial vs. autoatendimento do vendedor).
export const SITUACAO_DEFINICOES_DASHBOARD = [
  { id: 'G1', label: 'Cancelados', color: 'var(--red)' },
  { id: 'G2', label: 'Devolvidos', color: 'var(--blue)' },
  { id: 'G3', label: 'Recusados', color: 'var(--yellow)' },
  { id: 'G6', label: 'Refaturamento', color: 'var(--orange)' },
] as const;
