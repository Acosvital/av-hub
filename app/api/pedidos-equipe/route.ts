import { NextRequest, NextResponse } from 'next/server';
import { apiFetch, ApiFetchError } from '@/lib/api/fetchHelper';
import { requirePermission } from '@/lib/api/requirePermission';
import { PedidoPlanilhaProps } from '@/app/(protected)/pedidos-equipe/types';

interface VendasPlanilhaResponse {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  data: PedidoPlanilhaProps[];
}

const FLAGS_BOOLEANAS = [
  'autorizado',
  'denegado',
  'faturado',
  'cancelado',
  'devolvido',
  'devolucao_parcial',
  'encerrado',
  'manual',
];

// Pedidos da Equipe = todos os vendedores, TODOS os pedidos, sem filtro de
// "líquido"/grupo (diferente de vendas_base) — passthrough direto pra
// /vendas_planilha, a view crua de pedidos_vendas (mesma linha de raciocínio
// de pedidos-equipe/notas-equipe: sem cod_vendedor, empresa inteira).
export async function GET(request: NextRequest) {
  const denied = await requirePermission('pedidos-equipe', 'pode_visualizar');
  if (denied) return denied;

  try {
    const { searchParams } = request.nextUrl;
    const params = new URLSearchParams();

    // "numero_pedido" na UI mapeia pro campo real da view, pedido_venda.
    const numeroPedido = searchParams.get('numero_pedido');
    if (numeroPedido) params.set('pedido_venda', numeroPedido);

    ['data_inicio', 'data_fim', 'situacao', 'etapa'].forEach((key) => {
      const value = searchParams.get(key);
      if (value) params.set(key, value);
    });

    FLAGS_BOOLEANAS.forEach((key) => {
      const value = searchParams.get(key);
      if (value) params.set(key, value);
    });

    // Cascata de deduções (G1-G6/LIQUIDO) — ver docs/ENVIAR - contrato-filtro-grupo-deducao-planilha-crua.md.
    const grupo = searchParams.get('grupo');
    if (grupo) params.set('grupo', grupo);

    params.set('page', String(Number(searchParams.get('page')) || 1));
    params.set('limit', String(Number(searchParams.get('limit')) || 25));

    const headers = { 'x-api-key': process.env.API_KEY! };
    const resposta = await apiFetch<VendasPlanilhaResponse>(
      `${process.env.API_URL}/vendas_planilha?${params}`,
      'Erro ao buscar pedidos da equipe',
      { headers, cache: 'no-store' }
    );
    return NextResponse.json(resposta);
  } catch (error) {
    if (error instanceof ApiFetchError && error.status === 404) {
      return NextResponse.json({ data: [], total: 0, page: 1, limit: 0, total_pages: 0 });
    }
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
