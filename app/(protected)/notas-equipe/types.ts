// Espelha a projeção CRUA de /faturamento_planilha — layout do Excel de
// faturamento (37 colunas), NADA filtrado/derivado pelo banco (vêm NFs
// deletadas, de valor zero e de qualquer tipo_nf; total_nota_fiscal é o
// valor_nf cru). As flags (cancelado/devolvido/.../faturado/manual_*) são do
// PEDIDO vinculado à NF, não da nota em si, e não são mutuamente exclusivas
// — a mesma lógica de /vendas_planilha (ver situacaoNotaPlanilha.ts).
// Treze colunas fiscais (valor_icms, valor_pis, valor_cofins, etc.) não têm
// origem no banco e vêm sempre null — mantidas aqui só pra preservar o
// contrato de colunas do Excel na exportação.
export interface NotaPlanilhaProps {
  codigo_nf_omie: number;
  codigo_empresa: string;
  is_track_record: boolean;
  data_emissao: string | null;
  hora_emissao: string | null;
  nota_fiscal: string | null;
  cfop: string | null;
  destinatario: string | null;
  nome_fantasia_destinatario: string | null;
  cnpj_cpf_destinatario: string | null;
  codigo_categoria_nf: string | null;
  categoria_nf: string | null;
  codigo_categoria_pedido: string | null;
  categoria_pedido: string | null;
  codigo_vendedor: string | null;
  vendedor: string | null;
  filial_vendedor: string | null;
  total_mercadoria: string | null;
  valor_itens: string | null;
  desconto: string | null;
  valor_ipi: string | null;
  total_nota_fiscal: string | null;
  valor_nao_permitido: string | null;
  total_nota_fiscal_ajustado: string | null;
  valor_icms_st: string | null;
  frete: string | null;
  seguro: string | null;
  outras_despesas: string | null;
  impostos_aprox_federais: string | null;
  impostos_aprox_estaduais: string | null;
  impostos_aprox_municipais: string | null;
  valor_icms: string | null;
  valor_pis: string | null;
  valor_cofins: string | null;
  valor_fcp_icms: string | null;
  valor_fcp_icms_st: string | null;
  valor_icms_desonerado: string | null;
  tipo_nf: string | null;
  manifestacao_destinatario: string | null;
  pedido: string | null;
  obs_pedido: string | null;
  numero_contrato: string | null;
  refaturamento_tipo_ref: string | null;
  refaturamento_num_ref: string | null;
  status_refaturamento: 'Permitido' | 'Proibido' | 'Sem Referência' | null;
  codigo_pedido_omie: number | null;
  codigo_cliente: string | null;
  chave_nf: string | null;
  averbado: boolean | null;
  etapa: number | null;
  etapa_descricao: string | null;
  autorizado: boolean;
  denegado: boolean;
  faturado: boolean;
  cancelado: boolean;
  devolvido: boolean;
  devolucao_parcial: boolean;
  encerrado: boolean;
  manual_nf: boolean;
  manual_pedido: boolean;
  deleted_at: string | null;
}
