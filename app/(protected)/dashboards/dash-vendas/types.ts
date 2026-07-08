export interface RankingVendedoresVendasProps {
  mes: number;
  ano: number;
  posicao: string;
  cod_vendedor: string;
  vendedor: string;
  vendas: string;
  qtd_pedidos: string;
  perc_participacao: string;
  perc_meta: string;
  meta_individual: string;
}

export interface VendaMensalProps {
  mes: number;
  ano: number;
  vendas_total: string;
  qtd_pedidos: string;
  vendas_mes_anterior: string;
  qtd_pedidos_mes_anterior: string;
  vendas_mes_antepassado: string;
  qtd_pedidos_mes_antepassado: string;
  meta: string;
  perc_atingimento: string;
  vendas_hoje: string;
  vendas_ontem: string;
  pedidos_hoje: string;
  pedidos_ontem: string;
}

export interface RitmoMetaVendasProps {
  mes: number;
  ano: number;
  meta: string;
  dias_uteis_mes: string;
  dias_uteis_decorridos: string;
  vendas_acumulado: string;
  meta_diaria_ideal: string;
  meta_diaria_atual: string;
  status_ritmo: string;
}
