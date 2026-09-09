import { apiFetch } from '@/lib/api/fetchHelper';
import dateFormatter from '@/utils/dateFormatter';

// Campos reais devolvidos por GET /pedidos_vendas/{omie}/status-historico —
// NÃO é situacao_anterior/situacao_nova (isso nunca existiu na API; a tela
// só não tinha detectado porque o total normalmente vem 0). Sem filtro de
// `campo`, a linha do tempo mistura transições de situação e de data de
// previsão (ver rótulo em CAMPO_HISTORICO_LABEL).
export interface StatusHistoricoItemProps {
  campo: 'situacao' | 'data_previsao';
  valor_anterior: string | null;
  valor_novo: string;
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

export const CAMPO_HISTORICO_LABEL: Record<StatusHistoricoItemProps['campo'], string> = {
  situacao: 'Situação',
  data_previsao: 'Previsão de faturamento',
};

// valor_anterior/valor_novo de campo="data_previsao" chegam sujos como vêm
// da Omie (ex.: "00/00/0000", "") — dateFormatter quebra nesses casos
// (espera "AAAA-MM-DD"), por isso o formato é validado antes de aplicar.
const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

export function formatarValorHistorico(item: StatusHistoricoItemProps, valor: string | null) {
  if (!valor) return '—';
  if (item.campo === 'data_previsao') {
    return DATA_ISO.test(valor) ? dateFormatter(valor) : valor;
  }
  return valor;
}
