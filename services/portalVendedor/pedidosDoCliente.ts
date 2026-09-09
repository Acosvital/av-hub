import { apiFetch } from '@/lib/api/fetchHelper';

export interface PedidoClienteProps {
  codigo_pedido_omie: string;
  numero_pedido: string | null;
  data_inclusao: string | null;
  total_pedido: number;
  tipo_contrato: 'SPOT' | 'CONTRATO' | 'SEM CLASSIFICAÇÃO' | null;
  etapa_descricao: string | null;
}

interface PedidosClienteResponse {
  vinculado: boolean;
  data: PedidoClienteProps[];
}

export async function getPedidosDoCliente(params: {
  codigo_cliente: string;
  codigo_empresa?: string;
  mes: number;
  ano: number;
}) {
  const query = new URLSearchParams({
    codigo_cliente: params.codigo_cliente,
    mes: String(params.mes),
    ano: String(params.ano),
  });
  if (params.codigo_empresa) query.set('codigo_empresa', params.codigo_empresa);
  return apiFetch<PedidosClienteResponse>(
    `/api/meu-dashboard/cliente?${query}`,
    'Erro ao buscar pedidos do cliente'
  );
}
