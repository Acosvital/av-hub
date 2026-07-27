export interface NotasFiscaisSaidaProps {
  codigo_nf_omie: string;
  numero_nf: string;
  tipo_nf: '1'; // Saída
  chave_nf: string;
  data_emissao: string;
  hora_emissao: string;
  codigo_empresa: string;
  codigo_cliente: string;
  codigo_vendedor_omie: string;
  codigo_comprador_omie?: string;
  codigo_categoria: string;
  codigo_pedido_omie: number;
  oppedido: string;
  valor_mercadorias: string;
  valor_nf: string;
  valor_ipi: string;
  averbado: boolean;
  manual: boolean;
  created_by: string | null;
  updated_by: string | null;
  deleted_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
