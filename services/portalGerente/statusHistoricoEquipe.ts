import { apiFetch } from '@/lib/api/fetchHelper';

export interface StatusHistoricoItemProps {
  situacao_anterior: string | null;
  situacao_nova: string;
  detectado_em: string;
}

export interface StatusHistoricoEquipeResponse {
  codigo_pedido_omie: string;
  pedido_existe: boolean;
  total: number;
  historico: StatusHistoricoItemProps[];
}

export async function getStatusHistoricoEquipe(codigoPedidoOmie: number) {
  return apiFetch<StatusHistoricoEquipeResponse>(
    `/api/pedidos-equipe/${codigoPedidoOmie}/status-historico`,
    'Erro ao buscar histórico de status'
  );
}
