// Espelha a projeção de core_vendas_faturamento.vw_vendas_base (GET /vendas_base) —
// já resolvida (nome do cliente, categoria, status/refaturamento), 1 linha por
// família de pedido (a view já filtra sequencial = 0 e soma o valor com as parciais).
export interface PedidoVendedorProps {
  codigo_pedido_omie: number;
  numero_pedido: string | null;
  data_inclusao: string | null;
  hora_inclusao: string | null;
  data_previsao: string | null;
  numero_nf: string | null;
  codigo_cliente: string | null;
  nome_cliente: string | null;
  razao_social_cliente: string | null;
  categoria: string | null;
  cod_vendedor: string | null;
  vendedor: string | null;
  filial_vendedor: string | null;
  total_pedido: string | null;
  obs_pedido: string | null;
  numero_contrato: string | null;
  tipo_contrato: 'SPOT' | 'CONTRATO' | 'SEM CLASSIFICAÇÃO' | null;
  etapa: string | null;
  tem_original: boolean | null;
  cancelado: boolean;
  denegado: boolean;
  devolvido: boolean;
  devolucao_parcial: boolean;
  faturado: boolean;
  encerrado: boolean;
  situacao: string;
  is_refaturamento: boolean | null;
  grupo: 'G1' | 'G2' | 'G3' | 'G4' | 'G5' | 'G6' | 'LIQUIDO';
  codigo_empresa: string;
}
