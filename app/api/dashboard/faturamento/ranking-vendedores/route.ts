import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/fetchHelper';
import { requirePermission } from '@/lib/api/requirePermission';

export async function GET(request: NextRequest) {
  const denied = await requirePermission('dash-faturamento', 'pode_visualizar');
  if (denied) return denied;
  try {
    const { searchParams } = request.nextUrl;
    const params = new URLSearchParams();
    [
      'page',
      'limit',
      'mes',
      'ano',
      'cod_vendedor',
      'vendedor',
      'codigo_empresa',
      'is_track_record',
    ].forEach((key) => {
      const value = searchParams.get(key);
      if (value !== null) params.set(key, value);
    });
    const data = await apiFetch(
      `${process.env.API_URL}/ranking_vendedores_faturamento?${params}`,
      'Erro ao buscar ranking de vendedores',
      { headers: { 'x-api-key': process.env.API_KEY! }, cache: 'no-store' }
    );
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
