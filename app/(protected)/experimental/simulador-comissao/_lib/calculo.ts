import {
  COMISSAO_BASE_MARKUP,
  CONDICOES_PAGAMENTO,
  FAIXAS_COMISSAO,
  ICMS_POR_UF,
  ICMS_RECUPERAR_POR_ORIGEM,
  IMPOSTOS,
  MARGEM_DESEJADA,
  SOMA_DESPESAS_FIXAS,
} from '../_data/referencia';
import { CabecalhoPedido, ItemCalculado, ItemPedido, ResultadoPedido } from '../types';

// Excel ROUNDUP: arredonda sempre pra cima (em módulo), nunca pra baixo.
function roundUp(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.sign(value) * Math.ceil(Math.abs(value) * factor) / factor;
}

export function getEncargoCondicaoPagamento(condicao: string): number {
  return CONDICOES_PAGAMENTO.find((c) => c.label === condicao)?.encargo ?? 0;
}

export function getAliquotaICMSDestino(uf: string): number {
  return ICMS_POR_UF.find((u) => u.uf === uf)?.aliquota ?? 0;
}

/**
 * ICMS efetivo na venda (equivalente à coluna Z da aba SIMULAÇÃO PREÇO
 * PEDIDOS). Réplica das regras condicionais originais, com os rótulos de
 * origem normalizados (o Excel comparava texto sem diferenciar maiúsculas).
 */
export function calcularICMSEfetivo(
  origemCompra: string,
  ufDestino: string,
  isentoImposto: boolean,
  temST: boolean
): number {
  if (isentoImposto) return 0;
  const icmsDestino = getAliquotaICMSDestino(ufDestino);
  const destinoEhSP = ufDestino === 'São Paulo';

  if (origemCompra === 'Demais Estados - Importação') return destinoEhSP ? 0.18 : 0.04;
  if (origemCompra === 'São Paulo - Importação') return destinoEhSP ? 0.18 : 0.04;
  if (origemCompra === 'São Paulo - Base de ICMS Reduzida' && destinoEhSP) return 0.133;
  if (temST) return destinoEhSP ? 0 : icmsDestino;
  return icmsDestino;
}

/**
 * Multiplicador de markup — equivalente a L3/M3/N3 em "Cálculo de Mark-up".
 * Precisa embutir os impostos sobre a venda (ICMS do destino + PIS/COFINS/
 * IRPJ/CSL), senão o "preço sugerido" não cobre o que vai ser pago de
 * imposto e a margem líquida real sai negativa mesmo vendendo no preço
 * sugerido. Usa o ICMS do estado de destino do pedido (não dá pra saber o
 * ICMS efetivo por item antes de já ter um preço — mesma limitação que a
 * planilha original tinha ao usar um H5/destino único por pedido).
 */
export function calcularMultiplicadorMarkup(header: CabecalhoPedido): number {
  if (header.isentoImposto) {
    const somaSemImpostos = MARGEM_DESEJADA + SOMA_DESPESAS_FIXAS + COMISSAO_BASE_MARKUP;
    return roundUp(1 / (1 - somaSemImpostos), 2);
  }
  const icmsDestino = getAliquotaICMSDestino(header.ufDestino);
  const pis = IMPOSTOS.pisAliquota - IMPOSTOS.pisAliquota * icmsDestino;
  const cofins = IMPOSTOS.cofinsAliquota - IMPOSTOS.cofinsAliquota * icmsDestino;
  const irpj = IMPOSTOS.irpjBase * IMPOSTOS.irpjAliquota;
  const csl = IMPOSTOS.cslBase * IMPOSTOS.cslAliquota;
  const somaPercentuais =
    MARGEM_DESEJADA +
    SOMA_DESPESAS_FIXAS +
    COMISSAO_BASE_MARKUP +
    icmsDestino +
    pis +
    cofins +
    irpj +
    csl +
    IMPOSTOS.adicionalIrpj;
  return roundUp(1 / (1 - somaPercentuais), 2);
}

export function calcularItem(
  item: ItemPedido,
  header: CabecalhoPedido,
  multiplicadorMarkup: number,
  encargoCondicaoPagamento: number
): ItemCalculado {
  const compraTotal = item.quantidade * item.precoUnitCompra;
  const temST = item.valorST > 0;
  const percentICMSRecuperar = temST ? 0 : ICMS_RECUPERAR_POR_ORIGEM[item.origemCompra];
  const icmsRecuperar = compraTotal * percentICMSRecuperar;
  const valorIPI = compraTotal * item.percentIPI;
  const totalLiquidoCompra = compraTotal - icmsRecuperar + valorIPI + item.valorST;

  const precoUnitSugerido =
    item.quantidade > 0
      ? roundUp((totalLiquidoCompra / item.quantidade) * multiplicadorMarkup, 2) *
        (1 + encargoCondicaoPagamento)
      : 0;
  const precoTotalSugerido = precoUnitSugerido * item.quantidade;

  const precoUnitVendaEfetivo = item.precoUnitVenda ?? precoUnitSugerido;
  const valorVendaTotal = precoUnitVendaEfetivo * item.quantidade;

  const icmsEfetivoAliquota = calcularICMSEfetivo(
    item.origemCompra,
    header.ufDestino,
    header.isentoImposto,
    temST
  );
  const valorICMSEfetivo = valorVendaTotal * icmsEfetivoAliquota;

  const margemItem = valorVendaTotal > 0 ? (valorVendaTotal - totalLiquidoCompra) / valorVendaTotal : 0;
  const statusItem =
    valorVendaTotal <= 0 || margemItem <= 0
      ? 'PREJUÍZO'
      : margemItem < MARGEM_DESEJADA
      ? 'NEGOCIAR'
      : 'PEDIDO OK';

  return {
    ...item,
    compraTotal,
    icmsRecuperar,
    valorIPI,
    totalLiquidoCompra,
    precoUnitSugerido,
    precoTotalSugerido,
    precoUnitVendaEfetivo,
    valorVendaTotal,
    icmsEfetivoAliquota,
    valorICMSEfetivo,
    margemItem,
    statusItem,
  };
}

/**
 * Classifica a margem líquida real do pedido em letra + comissão, conforme
 * a tabela FAIXAS_COMISSAO (regra definida em 2026-09-10).
 */
export function classificarComissao(margemLiquidaReal: number) {
  const faixa =
    FAIXAS_COMISSAO.find((f) => margemLiquidaReal > f.min && margemLiquidaReal <= f.max) ??
    FAIXAS_COMISSAO[0];
  // margem exatamente 0 cai na faixa de prejuízo (min exclusivo, max inclusivo acima)
  if (margemLiquidaReal <= 0) return FAIXAS_COMISSAO[0];
  return faixa;
}

export function calcularPedido(header: CabecalhoPedido, itensPedido: ItemPedido[]): ResultadoPedido {
  const encargoCondicaoPagamento = getEncargoCondicaoPagamento(header.condicaoPagamento);
  const multiplicadorMarkup = calcularMultiplicadorMarkup(header);

  const itens = itensPedido.map((item) =>
    calcularItem(item, header, multiplicadorMarkup, encargoCondicaoPagamento)
  );

  const valorCompraTotal = itens.reduce((acc, i) => acc + i.totalLiquidoCompra, 0);
  const valorVendaSugeridaTotal = itens.reduce((acc, i) => acc + i.precoTotalSugerido, 0);
  const somaVendaItens = itens.reduce((acc, i) => acc + i.valorVendaTotal, 0);
  const valorVendaRealTotal =
    somaVendaItens + header.valorFreteVenda + header.valorSTPedido + header.impostoRetidoDifal;

  const somaICMSEfetivo = itens.reduce((acc, i) => acc + i.valorICMSEfetivo, 0);
  const icmsEfetivoMedio = valorVendaRealTotal > 0 ? somaICMSEfetivo / valorVendaRealTotal : 0;

  const pis = header.isentoImposto ? 0 : IMPOSTOS.pisAliquota - IMPOSTOS.pisAliquota * icmsEfetivoMedio;
  const cofins = header.isentoImposto
    ? 0
    : IMPOSTOS.cofinsAliquota - IMPOSTOS.cofinsAliquota * icmsEfetivoMedio;
  const irpj = header.isentoImposto ? 0 : IMPOSTOS.irpjBase * IMPOSTOS.irpjAliquota;
  const csl = header.isentoImposto ? 0 : IMPOSTOS.cslBase * IMPOSTOS.cslAliquota;
  const adicionalIrpj = header.isentoImposto ? 0 : IMPOSTOS.adicionalIrpj;
  const impostosPercent = header.isentoImposto
    ? 0
    : icmsEfetivoMedio + pis + cofins + irpj + csl + adicionalIrpj;
  const impostosReais = valorVendaRealTotal * impostosPercent;

  const despesasOperacionaisPercent = SOMA_DESPESAS_FIXAS;
  const despesasOperacionaisReais = valorVendaRealTotal * despesasOperacionaisPercent;

  const margemLiquidaReal =
    valorVendaRealTotal > 0
      ? (valorVendaRealTotal - despesasOperacionaisReais - impostosReais - valorCompraTotal) /
        valorVendaRealTotal
      : 0;

  const faixa = classificarComissao(margemLiquidaReal);
  const comissaoReais = valorVendaRealTotal * faixa.comissaoPct;

  return {
    itens,
    valorCompraTotal,
    valorVendaSugeridaTotal,
    valorVendaRealTotal,
    encargoCondicaoPagamento,
    multiplicadorMarkup,
    despesasOperacionaisPercent,
    despesasOperacionaisReais,
    icmsEfetivoMedio,
    impostosPercent,
    impostosReais,
    margemLiquidaReal,
    letra: faixa.letra,
    statusPedido: faixa.status,
    comissaoPercent: faixa.comissaoPct,
    comissaoReais,
  };
}
