// Espelha a linha devolvida por GET /api/comissoes/visao-geral (BFF), que já
// junta /faturamento_planilha + /vendas_planilha (sequencial) da api-avhub.
// As colunas de comissão ainda não têm fonte de dado — ficam null até
// existir uma rota real pra elas; a tela mostra "—" nesse caso.
export interface VisaoGeralComissaoRow {
  codigo_nf_omie: number | null;
  data_emissao: string | null;
  numero_pedido: string | null;
  nota_fiscal: string | null;
  cliente: string | null;
  vendedor: string | null;
  valor_faturado: number | null;
  margem_simulador: number | null;
  comissao_vendedor_pct: number | null;
  comissao_estimada: number | null;
  comissao_compras_pct: number | null;
  comissao_real_pct: number | null;
  valor_comissao_calculado: number | null;
  obs_comissao: string | null;
}
