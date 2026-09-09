import { NextRequest, NextResponse } from 'next/server';
import { apiFetch, ApiFetchError } from '@/lib/api/fetchHelper';
import { requirePermission } from '@/lib/api/requirePermission';
import { NotaPlanilhaProps } from '@/app/(protected)/notas-equipe/types';

interface FaturamentoPlanilhaResponse {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  data: NotaPlanilhaProps[];
}

// /faturamento_planilha só filtra estas flags (não tem "autorizado",
// "encerrado" nem "etapa" como query param, mesmo essas colunas existindo na
// resposta pra exibição) — diferente de /vendas_planilha.
const FLAGS_BOOLEANAS = ['denegado', 'faturado', 'cancelado', 'devolvido', 'devolucao_parcial', 'manual_nf'];

// Notas da Equipe = todos os vendedores, TODAS as NFs, sem filtro de
// "líquido"/grupo (diferente de nf_classified) — passthrough direto pra
// /faturamento_planilha, a view crua no layout do Excel de faturamento
// (mesma linha de raciocínio de pedidos-equipe: sem cod_vendedor, empresa
// inteira).
export async function GET(request: NextRequest) {
  const denied = await requirePermission('notas-equipe', 'pode_visualizar');
  if (denied) return denied;

  try {
    const { searchParams } = request.nextUrl;
    const params = new URLSearchParams();

    // "numero_nf" na UI mapeia pro campo real da view, nota_fiscal.
    const numeroNf = searchParams.get('numero_nf');
    if (numeroNf) params.set('nota_fiscal', numeroNf);

    // "numero_pedido" na UI mapeia pro campo real da view, pedido.
    const numeroPedido = searchParams.get('numero_pedido');
    if (numeroPedido) params.set('pedido', numeroPedido);

    ['data_inicio', 'data_fim'].forEach((key) => {
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
    const resposta = await apiFetch<FaturamentoPlanilhaResponse>(
      `${process.env.API_URL}/faturamento_planilha?${params}`,
      'Erro ao buscar notas fiscais da equipe',
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
