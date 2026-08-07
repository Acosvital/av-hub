export interface RankingVendedoresVendasProps {
  mes: number;
  ano: number;
  posicao: string;
  cod_vendedor: string;
  codigo_empresa: string;
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

export interface VendasPorTipoProps {
  mes: number;
  ano: number;
  tipo_contrato: 'SPOT' | 'CONTRATO' | 'SEM CLASSIFICAÇÃO';
  vendas: number | null;
  qtd_pedidos: number;
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

export interface DetalheVendedorVendasResumoProps {
  cod_vendedor: string;
  vendedor: string;
  total_pedidos: string;
  total_nfs: string;
  valor_total: string;
  qtd_spot: string;
  valor_spot: string | null;
  qtd_contrato: string;
  valor_contrato: string | null;
  qtd_sem_classificacao: string;
  valor_sem_classificacao: string | null;
  qtd_cancelado: string;
  valor_cancelado: string | null;
  qtd_devolvido: string;
  valor_devolvido: string | null;
  qtd_recusado: string;
  valor_recusado: string | null;
  qtd_refaturamento: string;
  valor_refaturamento: string | null;
  qtd_outros: string;
  valor_outros: string | null;
}

export interface ClientRankingVendasProps {
  mes: number;
  ano: number;
  tipo_contrato: 'SPOT' | 'CONTRATO' | 'SEM CLASSIFICAÇÃO';
  posicao: string;
  id_parceiro: string;
  cpf_cnpj: string;
  codigo_cliente: string;
  codigo_empresa: string;
  codigos_cliente: string[];
  cliente: string;
  vendas: string;
  qtd_pedidos: string;
  perc_participacao: string;
  empresas: string[];
}

export interface DetalheVendedorVendasPedidoProps {
  mes: number;
  ano: number;
  numero_pedido: string;
  numero_nf: string | null;
  nome_cliente: string;
  data_pedido: string | null;
  data_emissao: string | null;
  valor_pedido: string | null;
  valor_nf: string | null;
  tipo_contrato: string;
  classificacao: string;
  situacao: string;
}
