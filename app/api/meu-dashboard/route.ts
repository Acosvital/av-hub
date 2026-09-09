import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api/requirePermission';
import { resolverVendedoresSessao } from '@/lib/api/portalVendedor';
import {
  classificarPedidos,
  somarLado,
  topClientes,
  proximosVencimentos,
  topProdutos,
  mesAnterior,
  nomesUnidades,
} from '@/lib/api/meuDashboardDomain';

export async function GET(request: NextRequest) {
  const denied = await requirePermission('meu-dashboard', 'pode_visualizar');
  if (denied) return denied;

  try {
    const vendedores = await resolverVendedoresSessao();
    if (!vendedores) {
      return NextResponse.json({ vinculado: false });
    }

    const { searchParams } = request.nextUrl;
    const hoje = new Date();
    const mes = searchParams.get('mes') ?? String(hoje.getMonth() + 1);
    const ano = searchParams.get('ano') ?? String(hoje.getFullYear());
    const headers = { 'x-api-key': process.env.API_KEY! };

    const anterior = mesAnterior(mes, ano);

    // Resolvida uma vez só e repassada — topClientes/topProdutos não buscam
    // mais /unidades cada uma por conta própria (eram 2 chamadas concorrentes
    // e idênticas por carregamento de página, ver docs/portal-vendedor).
    const unidades = await nomesUnidades(headers);

    const [
      vendas,
      faturamento,
      classificacaoPedidos,
      meusTopClientes,
      vencimentos,
      produtos,
      vendasMesAnterior,
      faturamentoMesAnterior,
    ] = await Promise.all([
      somarLado('vendas', vendedores, mes, ano, headers),
      somarLado('faturamento', vendedores, mes, ano, headers),
      classificarPedidos(vendedores, mes, ano, headers),
      topClientes(vendedores, mes, ano, headers, unidades),
      proximosVencimentos(vendedores, mes, ano, headers),
      topProdutos(vendedores, mes, ano, headers, unidades),
      somarLado('vendas', vendedores, anterior.mes, anterior.ano, headers),
      somarLado('faturamento', vendedores, anterior.mes, anterior.ano, headers),
    ]);

    return NextResponse.json({
      vinculado: true,
      mes: Number(mes),
      ano: Number(ano),
      vendas,
      faturamento,
      classificacaoPedidos,
      topClientes: meusTopClientes,
      proximosVencimentos: vencimentos,
      topProdutos: produtos,
      comparacaoMesAnterior: {
        vendas: { valor: vendasMesAnterior.valor, quantidade: vendasMesAnterior.quantidade },
        faturamento: {
          valor: faturamentoMesAnterior.valor,
          quantidade: faturamentoMesAnterior.quantidade,
        },
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
