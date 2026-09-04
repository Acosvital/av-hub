import { apiFetch } from '@/lib/api/fetchHelper';

export interface StatusHistoricoItemProps {
  situacao_anterior: string | null;
  situacao_nova: string;
  detectado_em: string;
}

export interface StatusHistoricoResponse {
  codigo_pedido_omie: string;
  pedido_existe: boolean;
  total: number;
  historico: StatusHistoricoItemProps[];
}

export async function getStatusHistorico(codigoPedidoOmie: number) {
  return apiFetch<StatusHistoricoResponse>(
    `/api/meus-pedidos/${codigoPedidoOmie}/status-historico`,
    'Erro ao buscar histórico de status'
  );
}
