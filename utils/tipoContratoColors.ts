// Fonte única pra tipo de contrato (SPOT/CONTRATO/SEM CLASSIFICAÇÃO) e suas
// cores — antes duplicado (com pequenas diferenças) em dash-vendas-por-tipo,
// dash-faturamento-por-tipo e ClientCard.tsx. Paleta "Metais Nobres":
// champagne pro SPOT, aço pro CONTRATO, grafite neutro pro sem-classificação
// (a fatia dominante nas roscas hoje — fica neutra de propósito, pra não
// competir com os outros dois tipos).
export type ClientOrderType = 'SPOT' | 'CONTRATO' | 'SEM CLASSIFICAÇÃO';

const TIPO_CONTRATO_COLORS: Record<ClientOrderType, string> = {
  SPOT: 'var(--champagne)',
  CONTRATO: 'var(--steel)',
  'SEM CLASSIFICAÇÃO': 'var(--graphite)',
};

export default TIPO_CONTRATO_COLORS;
