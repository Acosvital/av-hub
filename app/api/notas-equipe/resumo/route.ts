import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api/requirePermission';
import { resumoFaturamentoPlanilhaEmpresa } from '@/lib/api/dashboardEquipeDomain';

export async function GET(request: NextRequest) {
  const denied = await requirePermission('notas-equipe', 'pode_visualizar');
  if (denied) return denied;

  try {
    const { searchParams } = request.nextUrl;
    const hoje = new Date();
    const mes = searchParams.get('mes') ?? String(hoje.getMonth() + 1);
    const ano = searchParams.get('ano') ?? String(hoje.getFullYear());
    const headers = { 'x-api-key': process.env.API_KEY! };

    const linhas = await resumoFaturamentoPlanilhaEmpresa(mes, ano, headers);
    return NextResponse.json({ data: linhas });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
