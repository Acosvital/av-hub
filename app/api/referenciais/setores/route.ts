import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/fetchHelper';
import { requirePermission } from '@/lib/api/requirePermission';

export async function GET() {
  const denied = await requirePermission('setores', 'pode_visualizar');
  if (denied) return denied;
  try {
    const data = await apiFetch(`${process.env.API_URL}/setores`, 'Erro ao buscar setores', {
      headers: { 'x-api-key': process.env.API_KEY! },
      cache: 'no-store',
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
