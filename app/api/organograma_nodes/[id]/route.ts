import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api/requirePermission';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const response = await fetch(`${process.env.API_URL}/organograma_nodes/${id}`, {
      headers: { 'x-api-key': process.env.API_KEY! },
      cache: 'no-store',
    });
    if (response.status === 404) {
      return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    }
    if (!response.ok) {
      const body = await response.text().catch(() => '(sem corpo)');
      console.error(`Erro ao buscar nó do organograma — status ${response.status}: ${body}`);
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
    return NextResponse.json(await response.json());
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission('funcionarios', 'pode_editar');
  if (denied) return denied;
  try {
    const { id } = await params;
    const body = await request.json();
    const response = await fetch(`${process.env.API_URL}/organograma_nodes/${id}`, {
      method: 'PUT',
      headers: { 'x-api-key': process.env.API_KEY!, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errBody = await response.text().catch(() => '(sem corpo)');
      console.error(`Erro ao atualizar nó do organograma — status ${response.status}: ${errBody}`);
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
    return NextResponse.json(await response.json());
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requirePermission('funcionarios', 'pode_deletar');
  if (denied) return denied;
  try {
    const { id } = await params;
    const response = await fetch(`${process.env.API_URL}/organograma_nodes/${id}`, {
      method: 'DELETE',
      headers: { 'x-api-key': process.env.API_KEY! },
    });
    if (!response.ok && response.status !== 404) {
      const body = await response.text().catch(() => '(sem corpo)');
      console.error(`Erro ao remover nó do organograma — status ${response.status}: ${body}`);
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
