import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/fetchHelper';
import { requirePermission } from '@/lib/api/requirePermission';
import { resolverVendedoresSessao } from '@/lib/api/portalVendedor';

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

interface PedidoBrutoResponse {
  codigo_vendedor_omie: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ codigo_pedido_omie: string }> }
) {
  const denied = await requirePermission('meus-pedidos', 'pode_visualizar');
  if (denied) return denied;

  try {
    const vendedores = await resolverVendedoresSessao();
    if (!vendedores) {
      return NextResponse.json({ error: 'Não vinculado a um vendedor' }, { status: 403 });
    }

    const { codigo_pedido_omie } = await params;
    const headers = { 'x-api-key': process.env.API_KEY! };

    // Confirma que o pedido é de um dos vendedores da sessão antes de
    // devolver o histórico — codigo_pedido_omie é sequencial/adivinhável,
    // então essa checagem é a única coisa que impede ver histórico de
    // pedido alheio.
    //
    // Atenção: `GET /pedidos_vendas?codigo_pedido_omie=X` (filtro de query)
    // NÃO filtra de verdade (confirmado ao vivo, 04/09 — devolve o total
    // geral, sem aplicar o filtro). Só o recurso único `GET
    // /pedidos_vendas/:id` (path param) funciona.
    const pedido = await apiFetch<PedidoBrutoResponse>(
      `${process.env.API_URL}/pedidos_vendas/${codigo_pedido_omie}`,
      'Erro ao verificar dono do pedido',
      { headers, cache: 'no-store' }
    ).catch(() => null);

    const pertenceAoVendedor = vendedores.some(
      (v) => v.codigo_vendedor_omie === pedido?.codigo_vendedor_omie
    );
    if (!pedido || !pertenceAoVendedor) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

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
