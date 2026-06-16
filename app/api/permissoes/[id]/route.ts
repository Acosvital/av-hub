import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const response = await fetch(`${process.env.API_URL}/permissoes/${id}`, {
      method: 'PUT',
      headers: {
        'x-api-key': process.env.API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error('Erro ao atualizar permissão');
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}