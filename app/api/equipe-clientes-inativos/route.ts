import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api/requirePermission';
import { clientesInativosEmpresa, nomesUnidades } from '@/lib/api/dashboardEquipeDomain';

export async function GET(request: NextRequest) {
  const denied = await requirePermission('dashboard-equipe', 'pode_visualizar');
  if (denied) return denied;

  try {
    const diasSemComprar = request.nextUrl.searchParams.get('dias_sem_comprar') ?? '90';
    const headers = { 'x-api-key': process.env.API_KEY! };

    const unidades = await nomesUnidades(headers);
    const data = await clientesInativosEmpresa(diasSemComprar, headers, unidades);

    return NextResponse.json({ data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
