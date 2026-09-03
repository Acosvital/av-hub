import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/fetchHelper';
import { requirePermission } from '@/lib/api/requirePermission';

export async function GET(request: NextRequest) {
  const denied = await requirePermission('dash-faturamento-por-tipo', 'pode_visualizar');
  if (denied) return denied;
  try {
    const { searchParams } = request.nextUrl;
    const params = new URLSearchParams();
    ['page', 'limit', 'mes', 'ano', 'tipo_contrato', 'codigo_empresa', 'is_track_record'].forEach(
      (key) => {
        const value = searchParams.get(key);
        if (value !== null) params.set(key, value);
      }
    );
    const data = await apiFetch(
      `${process.env.API_URL}/vendas_faturadas_por_tipo?${params}`,
      'Erro ao buscar faturamento por tipo',
      { headers: { 'x-api-key': process.env.API_KEY! }, cache: 'no-store' }
    );
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
