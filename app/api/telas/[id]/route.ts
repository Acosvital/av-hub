import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/fetchHelper';
import { requirePermission } from '@/lib/api/requirePermission';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission('telas', 'pode_editar');
  if (denied) return denied;
  try {
    const { id } = await params;
    const body = await request.json();
    const data = await apiFetch(`${process.env.API_URL}/telas/${id}`, 'Erro ao atualizar tela', {
      method: 'PUT',
      headers: { 'x-api-key': process.env.API_KEY!, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requirePermission('telas', 'pode_deletar');
  if (denied) return denied;
  try {
    const { id } = await params;
    const response = await fetch(`${process.env.API_URL}/telas/${id}`, {
      method: 'DELETE',
      headers: { 'x-api-key': process.env.API_KEY! },
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '(sem corpo)');
      console.error(`Erro ao deletar tela — status ${response.status}: ${body}`);
      throw new Error(`Erro ao deletar tela (status ${response.status})`);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
