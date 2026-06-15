import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(`${process.env.API_URL}/setores`, {
      headers: { 'x-api-key': process.env.API_KEY! },
      cache: 'no-store',
    });

    if (!response.ok) throw new Error('Erro ao buscar setores');
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
