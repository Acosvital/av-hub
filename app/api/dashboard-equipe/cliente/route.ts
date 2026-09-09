import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api/requirePermission';
import { pedidosDoClienteEmpresa } from '@/lib/api/dashboardEquipeDomain';

export async function GET(request: NextRequest) {
  const denied = await requirePermission('dashboard-equipe', 'pode_visualizar');
  if (denied) return denied;

  try {
    const { searchParams } = request.nextUrl;
    const codigoCliente = searchParams.get('codigo_cliente');
    if (!codigoCliente) {
      return NextResponse.json({ error: 'codigo_cliente é obrigatório' }, { status: 400 });
    }
    const hoje = new Date();
    const mes = searchParams.get('mes') ?? String(hoje.getMonth() + 1);
    const ano = searchParams.get('ano') ?? String(hoje.getFullYear());
    const headers = { 'x-api-key': process.env.API_KEY! };

    const pedidos = await pedidosDoClienteEmpresa(codigoCliente, mes, ano, headers);

    return NextResponse.json({ data: pedidos });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
