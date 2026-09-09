import { apiFetch } from '@/lib/api/fetchHelper';
import { PedidoClienteEmpresaProps } from '@/lib/api/dashboardEquipeDomain';

interface PedidosClienteEquipeResponse {
  data: PedidoClienteEmpresaProps[];
}

export async function getPedidosDoClienteEquipe(params: {
  codigo_cliente: string;
  mes: number;
  ano: number;
}) {
  const query = new URLSearchParams({
    codigo_cliente: params.codigo_cliente,
    mes: String(params.mes),
    ano: String(params.ano),
  });
  return apiFetch<PedidosClienteEquipeResponse>(
    `/api/dashboard-equipe/cliente?${query}`,
    'Erro ao buscar pedidos do cliente'
  );
}
