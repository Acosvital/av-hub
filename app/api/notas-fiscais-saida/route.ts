import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/fetchHelper';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const params = new URLSearchParams();
    [
      'codigo_empresa',
      'numero_nf',
      'tipo_nf',
      'codigo_vendedor_omie',
      'codigo_comprador_omie',
      'codigo_cliente',
      'codigo_categoria',
      'codigo_pedido_omie',
      'data_emissao',
      'data_inicio',
      'data_fim',
      'com_deletados',
      'page',
      'limit',
    ].forEach((key) => {
      const value = searchParams.get(key);
      if (value !== null) params.set(key, value);
    });
    const data = await apiFetch(
      `${process.env.API_URL}/nota_fiscal_saida?${params}`,
      'Erro ao buscar notas fiscais de saída',
      { headers: { 'x-api-key': process.env.API_KEY! }, cache: 'no-store' }
    );
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
