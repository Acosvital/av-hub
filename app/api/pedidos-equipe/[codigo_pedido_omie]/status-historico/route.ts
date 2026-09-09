import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/fetchHelper';
import { requirePermission } from '@/lib/api/requirePermission';

interface StatusHistoricoItemProps {
  situacao_anterior: string | null;
  situacao_nova: string;
  detectado_em: string;
}

interface StatusHistoricoResponse {
  codigo_pedido_omie: string;
  pedido_existe: boolean;
  total: number;
  historico: StatusHistoricoItemProps[];
}

// Sem checagem de "dono do pedido" (diferente do equivalente no Portal do
// Vendedor) — quem tem permissão em 'pedidos-equipe' já pode ver o pedido de
// qualquer vendedor, então a restrição de posse não se aplica aqui.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ codigo_pedido_omie: string }> }
) {
  const denied = await requirePermission('pedidos-equipe', 'pode_visualizar');
  if (denied) return denied;

  try {
    const { codigo_pedido_omie } = await params;
    const headers = { 'x-api-key': process.env.API_KEY! };

    const historico = await apiFetch<StatusHistoricoResponse>(
      `${process.env.API_URL}/pedidos_vendas/${codigo_pedido_omie}/status-historico`,
      'Erro ao buscar histórico de status',
      { headers, cache: 'no-store' }
    );
    return NextResponse.json(historico);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
