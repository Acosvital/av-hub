export interface ResumoLadoProps {
  vendedor: string;
  valor: number;
  quantidade: number;
  meta_individual: number;
  meta_total: number;
  perc_meta: number;
  perc_participacao: number;
}

export type TipoContrato = 'SPOT' | 'CONTRATO' | 'SEM CLASSIFICAÇÃO';

export interface ClassificacaoTipoProps {
  quantidade: number;
  valor: number;
}

export interface TopClienteProps {
  cliente: string;
  valor: number;
  qtd_pedidos: number;
}

export interface ClienteInativoProps {
  codigo_cliente: string;
  cliente: string;
  ultima_compra: string;
  dias_sem_comprar: number;
  valor_ultima_compra: string;
  qtd_pedidos: string;
  valor_total_historico: string;
}

export interface MeuDashboardResponse {
  vinculado: boolean;
  mes?: number;
  ano?: number;
  vendas?: ResumoLadoProps;
  faturamento?: ResumoLadoProps;
  // Classificação dos pedidos de venda por tipo de contrato — a meta do
  // vendedor é zerar "SEM CLASSIFICAÇÃO" (ver docs/portal-vendedor).
  classificacaoPedidos?: Record<TipoContrato, ClassificacaoTipoProps>;
  topClientes?: TopClienteProps[];
}
