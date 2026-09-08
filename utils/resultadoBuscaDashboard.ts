// Pedido abre no dashboard de Vendas, NF no de Faturamento — "por tipo" não
// tem ranking/modal próprio, então os dois tipos de resultado de busca
// sempre caem num desses dois dashboards base.
export type TipoResultadoBusca = 'pedido' | 'nf';

const DASHBOARD_POR_TIPO: Record<TipoResultadoBusca, 'vendas' | 'faturamento'> = {
  pedido: 'vendas',
  nf: 'faturamento',
};

const LABEL_POR_TIPO: Record<TipoResultadoBusca, string> = {
  pedido: 'Pedido',
  nf: 'NF',
};

export function dashboardDoResultado(tipo: TipoResultadoBusca) {
  return DASHBOARD_POR_TIPO[tipo];
}

export function labelDoResultado(tipo: TipoResultadoBusca) {
  return LABEL_POR_TIPO[tipo];
}
