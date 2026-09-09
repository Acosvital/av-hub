import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api/requirePermission';
import { resolverVendedoresSessao } from '@/lib/api/portalVendedor';
import { pedidosDoCliente } from '@/lib/api/meuDashboardDomain';

export async function GET(request: NextRequest) {
  const denied = await requirePermission('meu-dashboard', 'pode_visualizar');
  if (denied) return denied;

  try {
    const vendedores = await resolverVendedoresSessao();
    if (!vendedores) {
      return NextResponse.json({ vinculado: false, data: [] });
    }

    const { searchParams } = request.nextUrl;
    const codigoCliente = searchParams.get('codigo_cliente');
    if (!codigoCliente) {
      return NextResponse.json({ error: 'codigo_cliente é obrigatório' }, { status: 400 });
    }
    const hoje = new Date();
    const mes = searchParams.get('mes') ?? String(hoje.getMonth() + 1);
    const ano = searchParams.get('ano') ?? String(hoje.getFullYear());
    const headers = { 'x-api-key': process.env.API_KEY! };

    // Se veio codigo_empresa (clique numa linha já rotulada por unidade em
    // "Meus melhores clientes"/"Clientes sem comprar"), restringe a busca a
    // esse vínculo só — sem isso, um cliente com o mesmo codigo_cliente
    // comprando em 2 unidades do vendedor teria os pedidos das duas
    // misturados no modal, mesmo a linha de origem sendo de uma só.
    const codigoEmpresa = searchParams.get('codigo_empresa');
    const vendedoresFiltrados = codigoEmpresa
      ? vendedores.filter((v) => v.codigo_empresa === codigoEmpresa)
      : vendedores;

    const pedidos = await pedidosDoCliente(vendedoresFiltrados, codigoCliente, mes, ano, headers);

    return NextResponse.json({ vinculado: true, data: pedidos });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
