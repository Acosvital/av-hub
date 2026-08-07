export interface SellerRankingProps {
  mes: number;
  ano: number;
  posicao: string;
  cod_vendedor: string;
  codigo_empresa: string;
  vendedor: string;
  faturamento: string;
  qtd_pedidos: string;
  total_nfs: string;
  perc_participacao: string;
  perc_meta: string;
  meta_individual: string;
}

export interface FaturamentoMensalProps {
  mes: number;
  ano: number;
  faturamento_total: string;
  qtd_nfs: string;
  fat_mes_anterior: string;
  qtd_nfs_mes_anterior: string;
  fat_mes_antepassado: string;
  qtd_nfs_mes_antepassado: string;
  meta: string;
  perc_atingimento: string;
  fat_hoje: string;
  fat_ontem: string;
  pedidos_hoje: string;
  pedidos_ontem: string;
}

export interface FaturamentoPorTipoProps {
  mes: number;
  ano: number;
  tipo_contrato: 'CONTRATO' | 'SPOT' | 'SEM CLASSIFICAÇÃO';
  faturamento: string;
  percentual_qtd_nfs: string;
  percentual_faturamento: string;
  qtd_nfs: string;
}

export interface RitmoMetaFaturamentoProps {
  mes: number;
  ano: number;
  meta: string;
  dias_uteis_mes: string;
  dias_uteis_decorridos: string;
  fat_acumulado: string;
  meta_diaria_ideal: string;
  meta_diaria_atual: string;
  status_ritmo: string;
}

export interface SituacaoPedidosFaturadosProps {
  mes: number;
  ano: number;
  grupo_deducao: string;
  label_situacao: string;
  qtd_nfs: string;
  valor_total: string;
}

export interface DetalheVendedorFaturamentoResumoProps {
  cod_vendedor: string;
  vendedor: string | null;
  total_pedidos: string | null;
  total_nfs: string | null;
  valor_total: string | null;
  qtd_spot: string | null;
  valor_spot: string | null;
  qtd_contrato: string | null;
  valor_contrato: string | null;
  qtd_sem_classificacao: string | null;
  valor_sem_classificacao: string | null;
  qtd_cancelado: string | null;
  valor_cancelado: string | null;
  qtd_devolvido: string | null;
  valor_devolvido: string | null;
  qtd_recusado: string | null;
  valor_recusado: string | null;
  qtd_refaturamento: string | null;
  valor_refaturamento: string | null;
  qtd_outros: string | null;
  valor_outros: string | null;
}

export interface DetalheVendedorFaturamentoPedidoProps {
  mes: number;
  ano: number;
  numero_pedido: string | null;
  numero_nf: string | null;
  nome_cliente: string | null;
  data_pedido: string | null;
  data_emissao: string | null;
  valor_pedido: string | null;
  valor_nf: string | null;
  tipo_contrato: string;
  classificacao: string;
  situacao: string;
}

export interface ResumoMensalFaturamentoProps {
  periodo: string;
  fat_bruto: string;
  fat_ypfb: string;
  fat_com_ypfb: string;
  g1_cancelado: string;
  g2_devolvido: string;
  g3_recusado: string;
  g4_chile: string;
  g5_av_vendedor: string;
  g6_refaturamento: string;
  fat_liquido: string;
  batimento: string;
  total_nfs: string;
  total_nfs_liquidas: string;
}
