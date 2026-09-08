import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/fetchHelper';
import { requirePermission } from '@/lib/api/requirePermission';

export async function GET(req: NextRequest) {
  const denied = await requirePermission('fornecedores', 'pode_visualizar');
  if (denied) return denied;
  const { searchParams } = req.nextUrl;
  const params = new URLSearchParams();
  const search = searchParams.get('search');
  const estado = searchParams.get('estado');
  if (search) params.set('nome', search);
  if (estado) params.set('estado', estado);
  try {
    const data = await apiFetch(
      `${process.env.API_URL}/todos_os_fornecedores?${params}`,
      'Erro ao buscar todos os fornecedores',
      { headers: { 'x-api-key': process.env.API_KEY! }, cache: 'no-store' }
    );
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
