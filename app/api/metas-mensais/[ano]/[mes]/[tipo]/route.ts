import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api/requirePermission';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ ano: string; mes: string; tipo: string }> }
) {
  const denied = await requirePermission('metas-mensais', 'pode_deletar');
  if (denied) return denied;
  try {
    const { ano, mes, tipo } = await params;
    const response = await fetch(`${process.env.API_URL}/metas_mensais/${ano}/${mes}/${tipo}`, {
      method: 'DELETE',
      headers: { 'x-api-key': process.env.API_KEY! },
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '(sem corpo)');
      console.error(`Erro ao deletar meta — status ${response.status}: ${body}`);
      throw new Error(`Erro ao deletar meta (status ${response.status})`);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
