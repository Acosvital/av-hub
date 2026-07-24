import { NotasFiscaisSaidaProps } from '@/app/(protected)/vendas/notas-fiscais-saida/types';
import { PaginatedResponse } from './types';
import { apiFetch } from '@/lib/api/fetchHelper';

interface GetInterfaceNotasFiscaisSaidaParams {
  codigo_empresa?: string;
  numero_nf?: string;
  tipo_nf?: string;
  codigo_vendedor_omie?: string;
  codigo_comprador_omie?: string;
  codigo_cliente?: string;
  codigo_categoria?: string;
  codigo_pedido_omie?: number;
  data_emissao?: string;
  data_inicio?: string;
  data_fim?: string;
  com_deletados?: boolean;
  page?: number;
  limit?: number;
}

interface NotasFiscaisSaidaResponse extends PaginatedResponse {
  nota_fiscal_saida: NotasFiscaisSaidaProps[];
}

export async function getNotasFiscaisSaida(params: GetInterfaceNotasFiscaisSaidaParams = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.codigo_empresa) query.set('codigo_empresa', String(params.codigo_empresa));
  if (params.numero_nf) query.set('numero_nf', String(params.numero_nf));
  if (params.tipo_nf) query.set('tipo_nf', String(params.tipo_nf));
  if (params.codigo_vendedor_omie)
    query.set('codigo_vendedor_omie', String(params.codigo_vendedor_omie));
  if (params.codigo_comprador_omie)
    query.set('codigo_comprador_omie', String(params.codigo_comprador_omie));
  if (params.codigo_cliente) query.set('codigo_cliente', String(params.codigo_cliente));
  if (params.codigo_categoria) query.set('codigo_categoria', String(params.codigo_categoria));
  if (params.codigo_pedido_omie) query.set('codigo_pedido_omie', String(params.codigo_pedido_omie));
  if (params.data_emissao) query.set('data_emissao', String(params.data_emissao));
  if (params.data_inicio) query.set('data_inicio', String(params.data_inicio));
  if (params.data_fim) query.set('data_fim', String(params.data_fim));
  if (params.com_deletados) query.set('com_deletados', String(params.com_deletados));
  return apiFetch<NotasFiscaisSaidaResponse>(
    `/api/notas-fiscais-saida?${query}`,
    'Erro ao buscar notas fiscais de saída'
  );
}
