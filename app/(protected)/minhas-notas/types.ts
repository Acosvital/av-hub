// Espelha a projeção de core_vendas_faturamento.vw_nf_classified (GET /nf_classified) —
// já resolvida (destinatário, categoria) e classificada (grupo_deducao G1..G6/LIQUIDO).
export interface NotaFiscalVendedorProps {
  numero_nf: string;
  periodo: string;
  cfop: string | null;
  data_emissao: string | null;
  hora_emissao: string | null;
  situacao: string | null;
  cod_categoria: string | null;
  categoria: string | null;
  cod_vendedor: string | null;
  vendedor: string | null;
  destinatario: string | null;
  valor_mercadorias: number | null;
  valor_nf: number | null;
  manifestacao: string | null;
  obs_pedido: string | null;
  numero_pedido: string | null;
  numero_contrato: string | null;
  tipo_contrato: 'SPOT' | 'CONTRATO' | 'SEM CLASSIFICAÇÃO';
  is_ypfb: boolean;
  grupo_deducao: 'G1' | 'G2' | 'G3' | 'G4' | 'G5' | 'G6' | 'LIQUIDO' | null;
  is_manual: boolean;
  codigo_empresa: string;
}
