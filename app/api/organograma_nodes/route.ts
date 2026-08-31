import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/fetchHelper';
import { requirePermission } from '@/lib/api/requirePermission';

export async function POST(request: NextRequest) {
  const denied = await requirePermission('funcionarios', 'pode_editar');
  if (denied) return denied;
  try {
    const body = await request.json();
    const data = await apiFetch(
      `${process.env.API_URL}/organograma_nodes`,
      'Erro ao criar nó do organograma',
      {
        method: 'POST',
        headers: { 'x-api-key': process.env.API_KEY!, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
