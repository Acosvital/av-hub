import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/fetchHelper';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const params = new URLSearchParams();
    ['page', 'limit', 'mes', 'ano', 'codigo_cliente', 'cpf_cnpj', 'cliente', 'historico'].forEach(
      (key) => {
        const value = searchParams.get(key);
        if (value !== null) params.set(key, value);
      }
    );
    const data = await apiFetch(
      `${process.env.API_URL}/ranking_clientes_vendas?${params}`,
      'Erro ao buscar ranking de clientes',
      { headers: { 'x-api-key': process.env.API_KEY! }, cache: 'no-store' }
    );
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
