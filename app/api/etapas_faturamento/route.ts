import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/fetchHelper';
import { requirePermission } from '@/lib/api/requirePermission';

// Catálogo de etapas (core.etapas_faturamento) — usado hoje só pra montar o
// filtro de Etapa em Pedidos da Equipe com texto real em vez do código cru
// (o mesmo código tem descrição diferente por empresa, ver
// services/portalGerente/etapasFaturamento.ts).
export async function GET(request: NextRequest) {
  const denied = await requirePermission(['pedidos-equipe', 'notas-equipe'], 'pode_visualizar');
  if (denied) return denied;

  try {
    const { searchParams } = request.nextUrl;
    const params = new URLSearchParams();
    ['codigo_operacao', 'codigo_empresa'].forEach((key) => {
      const value = searchParams.get(key);
      if (value) params.set(key, value);
    });
    params.set('limit', String(Number(searchParams.get('limit')) || 200));

    const data = await apiFetch(
      `${process.env.API_URL}/etapas_faturamento?${params}`,
      'Erro ao buscar etapas de faturamento',
      { headers: { 'x-api-key': process.env.API_KEY! }, cache: 'no-store' }
    );
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
