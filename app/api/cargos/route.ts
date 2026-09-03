import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/fetchHelper';
import { requirePermission } from '@/lib/api/requirePermission';
import { comEscopoUnidade } from '@/lib/api/escopoUnidade';

export async function GET(request: NextRequest) {
  const denied = await requirePermission('cargos', 'pode_visualizar');
  if (denied) return denied;
  try {
    const { searchParams } = request.nextUrl;
    const params = new URLSearchParams();
    ['page', 'limit', 'nome', 'codigo_empresa', 'id_setor', 'ativo'].forEach((key) => {
      const value = searchParams.get(key);
      if (value !== null) params.set(key, value);
    });
    const data = await apiFetch(
      await comEscopoUnidade(`${process.env.API_URL}/cargos?${params}`),
      'Erro ao buscar cargos',
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

export async function POST(request: NextRequest) {
  const denied = await requirePermission('cargos', 'pode_criar');
  if (denied) return denied;
  try {
    const body = await request.json();
    const data = await apiFetch(await comEscopoUnidade(`${process.env.API_URL}/cargos`), 'Erro ao criar cargo', {
      method: 'POST',
      headers: { 'x-api-key': process.env.API_KEY!, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
