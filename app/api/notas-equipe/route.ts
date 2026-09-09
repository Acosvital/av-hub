import { NextRequest, NextResponse } from 'next/server';
import { apiFetch, ApiFetchError } from '@/lib/api/fetchHelper';
import { requirePermission } from '@/lib/api/requirePermission';
import { NotaFiscalVendedorProps } from '@/app/(protected)/minhas-notas/types';

interface NfClassifiedResponse {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  data: NotaFiscalVendedorProps[];
}

const FILTROS_REPASSADOS = ['numero_nf', 'numero_pedido', 'data_inicio', 'data_fim', 'grupo_deducao'];

// Notas da Equipe = todos os vendedores juntos — passthrough direto pro
// nf_classified sem cod_vendedor (empresa inteira).
export async function GET(request: NextRequest) {
  const denied = await requirePermission('notas-equipe', 'pode_visualizar');
  if (denied) return denied;

  try {
    const { searchParams } = request.nextUrl;
    const params = new URLSearchParams();
    FILTROS_REPASSADOS.forEach((key) => {
      const value = searchParams.get(key);
      if (value) params.set(key, value);
    });
    params.set('page', String(Number(searchParams.get('page')) || 1));
    params.set('limit', String(Number(searchParams.get('limit')) || 25));

    const headers = { 'x-api-key': process.env.API_KEY! };
    const resposta = await apiFetch<NfClassifiedResponse>(
      `${process.env.API_URL}/nf_classified?${params}`,
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
