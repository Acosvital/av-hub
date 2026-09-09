// Espelha a projeção CRUA de /vendas_planilha — NADA é filtrado/derivado
// pelo banco (vêm registros de todos os sequenciais, etapa 0 incluída,
// sem soma de família). Situação vem tanto como texto livre (`situacao`)
// quanto como flags booleanas independentes (autorizado/denegado/faturado/
// cancelado/devolvido/devolucao_parcial/encerrado/manual) — mais de uma
// pode estar true ao mesmo tempo, não é um "grupo" mutuamente exclusivo
// como vw_vendas_base.
export interface PedidoPlanilhaProps {
  codigo_pedido_omie: number;
  codigo_empresa: string;
  is_track_record: boolean;
  data_inclusao: string | null;
  hora_inclusao: string | null;
  pedido_venda: string | null;
  nota_fiscal: string | null;
  destinatario: string | null;
  cnpj_cpf_destinatario: string | null;
  situacao: string | null;
  codigo_categoria: string | null;
  categoria: string | null;
  codigo_vendedor: string | null;
  vendedor: string | null;
  total_pedido_venda: string | null;
  manifestacao_destinatario: string | null;
  pedido: string | null;
  obs_pedido: string | null;
  numero_contrato: string | null;
  sequencial: number | null;
  etapa: number | null;
  data_previsao: string | null;
  data_faturamento: string | null;
  hora_faturamento: string | null;
  data_cancelamento: string | null;
  data_encerramento: string | null;
  codigo_cliente: string | null;
  razao_social_destinatario: string | null;
  cidade_destinatario: string | null;
  estado_destinatario: string | null;
  codigo_projeto: string | null;
  filial_vendedor: string | null;
  autorizado: boolean;
  denegado: boolean;
  faturado: boolean;
  cancelado: boolean;
  devolvido: boolean;
  devolucao_parcial: boolean;
  encerrado: boolean;
  manual: boolean;
  deleted_at: string | null;
}
