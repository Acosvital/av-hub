import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/fetchHelper';
import { requirePermission } from '@/lib/api/requirePermission';

// Sugestão de vínculo com funcionário (mesmo nome já vinculado em outra
// unidade — ver docs/contrato-vinculo-vendedor-funcionario.md, item 3.1).
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission('vendedores', 'pode_visualizar');
  if (denied) return denied;
  try {
    const { id } = await params;
    const { searchParams } = request.nextUrl;
    const query = new URLSearchParams();
    ['min_score', 'limit'].forEach((key) => {
      const value = searchParams.get(key);
      if (value !== null) query.set(key, value);
    });
    const data = await apiFetch(
      `${process.env.API_URL}/vendedores/${id}/sugestoes?${query}`,
      'Erro ao buscar sugestão de vínculo',
      {
        headers: { 'x-api-key': process.env.API_KEY! },
        cache: 'no-store',
      }
    );
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
