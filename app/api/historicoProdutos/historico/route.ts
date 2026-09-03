import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/fetchHelper';
import { requirePermission } from '@/lib/api/requirePermission';

export async function GET(req: NextRequest) {
  const denied = await requirePermission('historico-produtos', 'pode_visualizar');
  if (denied) return denied;
  const produto = req.nextUrl.searchParams.get('produto');
  const parceiro = req.nextUrl.searchParams.get('parceiro');
  try {
    const data = await apiFetch(
      `${process.env.API_URL}/historico_precos?id_produto=${produto}&id_parceiro=${parceiro}`,
      'Erro ao buscar histórico de preços',
      { headers: { 'x-api-key': process.env.API_KEY! }, cache: 'no-store' }
    );
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
