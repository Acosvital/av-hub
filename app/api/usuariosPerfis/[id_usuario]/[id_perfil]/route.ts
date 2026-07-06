import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api/requirePermission';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id_usuario: string; id_perfil: string }> }
) {
  const denied = await requirePermission('usuarios-perfis', 'pode_deletar');
  if (denied) return denied;
  try {
    const { id_perfil, id_usuario } = await params;
    const response = await fetch(
      `${process.env.API_URL}/usuarios_perfis/${id_usuario}/${id_perfil}`,
      {
        method: 'DELETE',
        headers: { 'x-api-key': process.env.API_KEY! },
      }
    );
    if (!response.ok) {
      const body = await response.text().catch(() => '(sem corpo)');
      console.error(`Erro ao deletar vínculo — status ${response.status}: ${body}`);
      throw new Error(`Erro ao deletar vínculo (status ${response.status})`);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
