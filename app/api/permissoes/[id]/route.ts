import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/fetchHelper';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = await apiFetch(`${process.env.API_URL}/permissoes/${id}`, 'Erro ao atualizar permissão', {
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
