import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/fetchHelper';
import { requirePermission } from '@/lib/api/requirePermission';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ ano: string; mes: string; tipo: string }> }
) {
  const denied = await requirePermission('fechamento', 'pode_deletar');
  if (denied) return denied;
  try {
    const { ano, mes, tipo } = await params;
    const data = await apiFetch(
      `${process.env.API_URL}/fechamento_manual/${ano}/${mes}/${tipo}`,
      'Erro ao remover fechamento',
      { method: 'DELETE', headers: { 'x-api-key': process.env.API_KEY! } }
    );
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
