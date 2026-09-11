import { OrigemCompra } from './_data/referencia';

export interface ItemPedido {
  id: string;
  descricao: string;
  quantidade: number;
  um: string;
  precoUnitCompra: number;
  fornecedor: string;
  origemCompra: OrigemCompra;
  percentIPI: number;
  valorST: number;
  precoUnitVenda: number | null; // null => usa o preço sugerido calculado
}

export interface CabecalhoPedido {
  cliente: string;
  numeroPedido: string;
  ufDestino: string;
  isentoImposto: boolean;
  condicaoPagamento: string;
  valorFreteVenda: number;
  valorSTPedido: number;
  impostoRetidoDifal: number;
}

export type LetraComissao = 'A' | 'B' | 'C' | 'D';
export type StatusPedido = 'PREJUÍZO' | 'OK';
export type StatusItem = 'PREJUÍZO' | 'NEGOCIAR' | 'PEDIDO OK';

export interface ItemCalculado extends ItemPedido {
  compraTotal: number;
  icmsRecuperar: number;
  valorIPI: number;
  totalLiquidoCompra: number;
  precoUnitSugerido: number;
  precoTotalSugerido: number;
  precoUnitVendaEfetivo: number;
  valorVendaTotal: number;
  icmsEfetivoAliquota: number;
  valorICMSEfetivo: number;
  margemItem: number;
  statusItem: StatusItem;
}

export interface ResultadoPedido {
  itens: ItemCalculado[];
  valorCompraTotal: number;
  valorVendaSugeridaTotal: number;
  valorVendaRealTotal: number;
  encargoCondicaoPagamento: number;
  multiplicadorMarkup: number;
  despesasOperacionaisPercent: number;
  despesasOperacionaisReais: number;
  icmsEfetivoMedio: number;
  impostosPercent: number;
  impostosReais: number;
  margemLiquidaReal: number;
  letra: LetraComissao;
  statusPedido: StatusPedido;
  comissaoPercent: number;
  comissaoReais: number;
}
