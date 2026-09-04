/**
 * Agrupamento visual dos itens de nível 0 do menu, por id. A API
 * (`/api/menu`) retorna uma lista plana, sem conceito de grupo — este
 * mapa existe só no frontend para renderizar os rótulos de seção.
 * Ids sem entrada aqui (ex. `dashboards`) ficam sem rótulo acima.
 */
const groupMap: Record<string, string> = {
  crm: 'Operações',
  vendas: 'Operações',
  servicos: 'Operações',
  compras: 'Operações',
  orcamento: 'Operações',
  pcp: 'Operações',
  rh: 'Gestão de Pessoas',
  cadastros: 'Gestão de Pessoas',
  admin: 'Configurações',
  'meu-dashboard': 'Portal do Vendedor',
  'meus-pedidos': 'Portal do Vendedor',
  'minhas-notas': 'Portal do Vendedor',
};

export default groupMap;
