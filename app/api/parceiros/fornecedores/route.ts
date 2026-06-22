import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/fetchHelper';

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get('search');
  try {
    const data = await apiFetch(
      `${process.env.API_URL}/fornecedores_com_produtos?nome_fantasia=${search}`,
      'Erro ao buscar fornecedores',
      { headers: { 'x-api-key': process.env.API_KEY! }, cache: 'no-store' }
    );
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
