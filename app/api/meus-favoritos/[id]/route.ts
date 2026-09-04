import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api/requirePermission';
import { obterIdUsuarioSessao } from '@/lib/api/portalVendedor';

// id_usuario vem só da sessão (nunca do request) — o backend já escopa a
// exclusão a esse usuário via path (/usuarios/:id_usuario/favoritos/:id),
// então não tem como um usuário apagar favorito de outro mesmo sabendo o id.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requirePermission('meus-pedidos', 'pode_visualizar');
  if (denied) return denied;

  try {
    const idUsuario = await obterIdUsuarioSessao();
    if (!idUsuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    const response = await fetch(
      `${process.env.API_URL}/usuarios/${idUsuario}/favoritos/${id}`,
      { method: 'DELETE', headers: { 'x-api-key': process.env.API_KEY! } }
    );
    if (!response.ok) {
      const body = await response.text().catch(() => '(sem corpo)');
      console.error(`Erro ao remover favorito — status ${response.status}: ${body}`);
      return NextResponse.json({ error: 'Erro ao remover favorito' }, { status: response.status });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
