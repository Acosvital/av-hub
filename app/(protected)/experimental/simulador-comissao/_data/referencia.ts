/**
 * Tabelas de referência do simulador — espelham as abas "DADOS" e
 * "Classificação das Despesas (%)" da planilha CUSTO_*_desb.xlsx (snapshot
 * Fev-Mai/23, a mesma base que a planilha usa hoje).
 *
 * Protótipo local: nada aqui vem de API. Quando o módulo virar contrato
 * pro DBA, estes valores devem ser revisados/atualizados com dado real.
 */

export const ORIGEM_COMPRA = [
  'São Paulo',
  'São Paulo - Base de ICMS Reduzida',
  'Demais Estados',
  'São Paulo - Importação',
  'Demais Estados - Importação',
  'Optante Simples',
] as const;
export type OrigemCompra = (typeof ORIGEM_COMPRA)[number];

// % de ICMS a recuperar na compra, por origem (aba SIMULAÇÃO PREÇO PEDIDOS, coluna J)
export const ICMS_RECUPERAR_POR_ORIGEM: Record<OrigemCompra, number> = {
  'São Paulo': 0.18,
  'São Paulo - Base de ICMS Reduzida': 0.133,
  'Demais Estados': 0.12,
  'São Paulo - Importação': 0.18,
  'Demais Estados - Importação': 0.04,
  'Optante Simples': 0,
};

// Alíquota de ICMS na venda, por estado de destino (aba DADOS!V3:W10)
export const ICMS_POR_UF = [
  { uf: 'São Paulo', aliquota: 0.18 },
  { uf: 'Minas Gerais', aliquota: 0.12 },
  { uf: 'Paraná', aliquota: 0.12 },
  { uf: 'Rio de Janeiro', aliquota: 0.12 },
  { uf: 'Rio Grande do Sul', aliquota: 0.12 },
  { uf: 'Santa Catarina', aliquota: 0.12 },
  { uf: 'Demais estados', aliquota: 0.07 },
  { uf: 'Importação', aliquota: 0.04 },
] as const;

// Encargo % por condição de pagamento (aba DADOS!B3:C21)
export const CONDICOES_PAGAMENTO: { label: string; encargo: number }[] = [
  { label: 'À Vista', encargo: 0 },
  { label: '30 DDL', encargo: 0.01 },
  { label: '0/21', encargo: 0.01 },
  { label: '0/30', encargo: 0.01 },
  { label: '1/30/45', encargo: 0.015 },
  { label: '28/35', encargo: 0.01 },
  { label: '28/35/42', encargo: 0.015 },
  { label: '28/35/42/56', encargo: 0.02 },
  { label: '28/42', encargo: 0.015 },
  { label: '28/42/56', encargo: 0.02 },
  { label: '28/45', encargo: 0.015 },
  { label: '30/45', encargo: 0.015 },
  { label: '30/45/60', encargo: 0.02 },
  { label: '30/45/60/75', encargo: 0.025 },
  { label: '30/45/60/75/90', encargo: 0.03 },
  { label: '30/60', encargo: 0.02 },
  { label: '30/60/90', encargo: 0.03 },
  { label: '30/60/90/120', encargo: 0.04 },
  { label: '34/40', encargo: 0.015 },
];

// Percentuais fixos de despesa (aba "Cálculo de Mark-up"!L6:L14, cada um
// vindo de um VLOOKUP na aba "Classificação das Despesas (%)"). Somados,
// batem com o E13/F13 da planilha original (11,45%).
export const DESPESAS_FIXAS = {
  contribuicoes: 0.000163461057500636,
  pessoal: 0.020087073004454,
  administrativas: 0.00467568976433114,
  logistica: 0.0143897526359063,
  financeiras: 0.063506533253662,
  producao: 0.00146141305592605,
  marketing: 0.000522827835366363,
  servicosTerceiros: 0.00407125204268035,
  sedes: 0.00563933615942824,
};

export const SOMA_DESPESAS_FIXAS = Object.values(DESPESAS_FIXAS).reduce((a, b) => a + b, 0);

// Impostos federais fixos ("Cálculo de Mark-up"!L16:L20)
export const IMPOSTOS = {
  pisAliquota: 0.0065,
  cofinsAliquota: 0.03,
  irpjBase: 0.08,
  irpjAliquota: 0.15,
  cslBase: 0.12,
  cslAliquota: 0.09,
  adicionalIrpj: 0.0076,
};

// Margem de lucro desejada (usada só pra sinalizar status do item), e
// comissão-base usada no cálculo do multiplicador de markup.
export const MARGEM_DESEJADA = 0.1;
export const COMISSAO_BASE_MARKUP = 0.02;

/**
 * Faixa de comissão por margem líquida real do pedido — regra NOVA definida
 * em 2026-09-10, substitui a tabela DADOS!I3:J8 da planilha.
 *
 * Diferença importante em relação à planilha: se a margem líquida real for
 * <= 0% (prejuízo), a comissão é zerada mesmo a letra caindo em "D" — a
 * planilha original não fazia essa distinção de forma automática (o status
 * "Prejuízo" e a letra "D" eram calculados em lugares separados, sem se
 * conectar na comissão).
 */
export const FAIXAS_COMISSAO = [
  { letra: 'D' as const, min: -Infinity, max: 0, comissaoPct: 0, status: 'PREJUÍZO' as const },
  { letra: 'D' as const, min: 0, max: 0.09, comissaoPct: 0.005, status: 'OK' as const },
  { letra: 'C' as const, min: 0.09, max: 0.12, comissaoPct: 0.007, status: 'OK' as const },
  { letra: 'B' as const, min: 0.12, max: 0.15, comissaoPct: 0.013, status: 'OK' as const },
  { letra: 'A' as const, min: 0.15, max: Infinity, comissaoPct: 0.02, status: 'OK' as const },
];
