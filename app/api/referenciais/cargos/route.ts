import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/fetchHelper';

export async function GET() {
  try {
    const data = await apiFetch(
      `${process.env.API_URL}/cargos`,
      'Erro ao buscar cargos',
      { headers: { 'x-api-key': process.env.API_KEY! }, cache: 'no-store' }
    );
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
