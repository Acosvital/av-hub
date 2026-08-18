import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/fetchHelper';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const params = new URLSearchParams();
    [
      'cod_vendedor',
      'codigo_empresa',
      'mes',
      'ano',
      'numero_pedido',
      'numero_nf',
      'nome_cliente',
      'tipo_contrato',
      'classificacao',
      'situacao',
      'data_pedido',
      'data_inicio',
      'data_fim',
      'page',
      'limit',
      'historico',
    ].forEach((key) => {
      const value = searchParams.get(key);
      if (value !== null) params.set(key, value);
    });
    const data = await apiFetch(
      `${process.env.API_URL}/detalhe_vendedor_faturamento?${params}`,
      'Erro ao buscar detalhe do vendedor',
      { headers: { 'x-api-key': process.env.API_KEY! }, cache: 'no-store' }
    );
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
