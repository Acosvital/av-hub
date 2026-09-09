import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api/requirePermission';
import {
  resumoEmpresa,
  classificacaoPedidosEmpresa,
  topClientesEmpresa,
  topProdutosEmpresa,
  proximosVencimentosEmpresa,
  nomesUnidades,
} from '@/lib/api/dashboardEquipeDomain';

// Dashboard da Equipe é a empresa inteira (todos os vendedores juntos), não
// 1 vendedor selecionado — por isso não passa por resolverVendedoresSessao
// nem por nenhuma seleção explícita, só o mês/ano.
export async function GET(request: NextRequest) {
  const denied = await requirePermission('dashboard-equipe', 'pode_visualizar');
  if (denied) return denied;

  try {
    const { searchParams } = request.nextUrl;
    const hoje = new Date();
    const mes = searchParams.get('mes') ?? String(hoje.getMonth() + 1);
    const ano = searchParams.get('ano') ?? String(hoje.getFullYear());
    const headers = { 'x-api-key': process.env.API_KEY! };

    const unidades = await nomesUnidades(headers);

    const [vendas, faturamento, classificacaoPedidos, topClientes, vencimentos, topProdutos] =
      await Promise.all([
        resumoEmpresa('vendas', mes, ano, headers),
        resumoEmpresa('faturamento', mes, ano, headers),
        classificacaoPedidosEmpresa(mes, ano, headers),
        topClientesEmpresa(mes, ano, headers, unidades),
        proximosVencimentosEmpresa(mes, ano, headers),
        topProdutosEmpresa(mes, ano, headers),
      ]);

    return NextResponse.json({
      mes: Number(mes),
      ano: Number(ano),
      vendas,
      faturamento,
      classificacaoPedidos,
      topClientes,
      proximosVencimentos: vencimentos,
      topProdutos,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
