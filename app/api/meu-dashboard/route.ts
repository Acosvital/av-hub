import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/fetchHelper';
import { requirePermission } from '@/lib/api/requirePermission';
import { resolverVendedoresSessao } from '@/lib/api/portalVendedor';

interface RankingVendedorLinhaProps {
  vendedor: string;
  vendas?: string;
  faturamento?: string;
  meta_individual: string;
}

interface RankingVendedoresResponse {
  data: RankingVendedorLinhaProps[];
}

interface DashboardMensalResponse {
  data: { meta: string }[];
  consolidado?: { meta: string };
}

type TipoContrato = 'SPOT' | 'CONTRATO' | 'SEM CLASSIFICAÇÃO';

interface VendaBaseLinhaProps {
  tipo_contrato: TipoContrato | null;
  total_pedido: string | null;
}

interface VendasBaseResponse {
  total: number;
  data: VendaBaseLinhaProps[];
}

type Lado = 'vendas' | 'faturamento';

// Primeiro/último dia do mês, no formato que /vendas_base espera
// (data_inicio/data_fim), a partir de mes/ano em uso no resto da rota.
function intervaloDoMes(mes: string, ano: string) {
  const m = Number(mes);
  const a = Number(ano);
  const ultimoDia = new Date(a, m, 0).getDate();
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    dataInicio: `${a}-${pad(m)}-01`,
    dataFim: `${a}-${pad(m)}-${pad(ultimoDia)}`,
  };
}

// Classificação SPOT/CONTRATO/SEM CLASSIFICAÇÃO dos pedidos do mês — não
// existe endpoint de agregação por vendedor pra isso (fn_vendas_por_tipo_contrato
// só agrega por empresa inteira), então busca a lista de vendas_base (que já
// tem tipo_contrato por linha, filtrada por cod_vendedor) e soma no servidor.
// Volume mensal de 1 vendedor é pequeno o bastante pra isso ser barato.
async function classificarPedidos(
  vendedores: { codigo_vendedor_omie: string; codigo_empresa: string }[],
  mes: string,
  ano: string,
  headers: Record<string, string>
): Promise<Record<TipoContrato, { quantidade: number; valor: number }>> {
  const { dataInicio, dataFim } = intervaloDoMes(mes, ano);
  const contagem: Record<TipoContrato, { quantidade: number; valor: number }> = {
    SPOT: { quantidade: 0, valor: 0 },
    CONTRATO: { quantidade: 0, valor: 0 },
    'SEM CLASSIFICAÇÃO': { quantidade: 0, valor: 0 },
  };

  for (const v of vendedores) {
    const params = new URLSearchParams({
      cod_vendedor: v.codigo_vendedor_omie,
      codigo_empresa: v.codigo_empresa,
      data_inicio: dataInicio,
      data_fim: dataFim,
      limit: '1000',
    });
    const resposta = await apiFetch<VendasBaseResponse>(
      `${process.env.API_URL}/vendas_base?${params}`,
      'Erro ao buscar classificação dos pedidos',
      { headers, cache: 'no-store' }
    ).catch(() => null);

    for (const linha of resposta?.data ?? []) {
      const tipo = linha.tipo_contrato ?? 'SEM CLASSIFICAÇÃO';
      contagem[tipo].quantidade += 1;
      contagem[tipo].valor += Number(linha.total_pedido) || 0;
    }
  }

  return contagem;
}

interface RankingClienteLinhaProps {
  cliente: string;
  vendas: string;
  qtd_pedidos: string;
}

interface RankingClientesResponse {
  data: RankingClienteLinhaProps[];
}

export interface TopClienteProps {
  cliente: string;
  valor: number;
  qtd_pedidos: number;
}

// Top clientes do vendedor no mês — seção 8.5 do plano, liberada pelo
// contrato 003 (cod_vendedor em ranking_clientes_vendas). Pega o ranking já
// pronto de cada empresa (sem paginar tudo — 10 já cobre o top real) e
// mescla se o vendedor tiver mais de um vínculo.
async function topClientes(
  vendedores: { codigo_vendedor_omie: string; codigo_empresa: string }[],
  mes: string,
  ano: string,
  headers: Record<string, string>
): Promise<TopClienteProps[]> {
  const listas = await Promise.all(
    vendedores.map((v) => {
      const params = new URLSearchParams({
        mes,
        ano,
        codigo_empresa: v.codigo_empresa,
        cod_vendedor: v.codigo_vendedor_omie,
        limit: '10',
      });
      return apiFetch<RankingClientesResponse>(
        `${process.env.API_URL}/ranking_clientes_vendas?${params}`,
        'Erro ao buscar top clientes',
        { headers, cache: 'no-store' }
      )
        .then((r) => r.data ?? [])
        .catch(() => []);
    })
  );

  return listas
    .flat()
    .map((c) => ({
      cliente: c.cliente,
      valor: Number(c.vendas) || 0,
      qtd_pedidos: Number(c.qtd_pedidos) || 0,
    }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5);
}

async function somarLado(
  lado: Lado,
  vendedores: { codigo_vendedor_omie: string; codigo_empresa: string }[],
  mes: string,
  ano: string,
  headers: Record<string, string>
) {
  const { dataInicio, dataFim } = intervaloDoMes(mes, ano);
  let vendedorNome = '';
  let somaValor = 0;
  let somaMetaIndividual = 0;
  let somaQtd = 0;

  for (const v of vendedores) {
    const params = new URLSearchParams({
      mes,
      ano,
      codigo_empresa: v.codigo_empresa,
      cod_vendedor: v.codigo_vendedor_omie,
    });
    const ranking = await apiFetch<RankingVendedoresResponse>(
      `${process.env.API_URL}/ranking_vendedores_${lado}?${params}`,
      `Erro ao buscar ranking de ${lado}`,
      { headers, cache: 'no-store' }
    ).catch(() => null);

    const linha = ranking?.data?.[0];
    if (linha) {
      vendedorNome = linha.vendedor;
      somaValor += Number(lado === 'vendas' ? linha.vendas : linha.faturamento) || 0;
      somaMetaIndividual += Number(linha.meta_individual) || 0;
    }

    // Contagem de pedidos/NFs — `detalhe_vendedor_vendas`/`_faturamento` (o
    // resumo "oficial") devolve "nenhum pedido líquido encontrado" mesmo
    // quando vendas_base/nf_classified têm registros reais (confirmado ao
    // vivo, 04/09) — parece quebrado nesses dois endpoints. Conta direto na
    // view que já se provou confiável: limit=1 só pra ler `total`.
    const rota = lado === 'vendas' ? 'vendas_base' : 'nf_classified';
    const contagemParams = new URLSearchParams({
      cod_vendedor: v.codigo_vendedor_omie,
      data_inicio: dataInicio,
      data_fim: dataFim,
      limit: '1',
    });
    if (lado === 'vendas') contagemParams.set('codigo_empresa', v.codigo_empresa);
    const contagem = await apiFetch<VendasBaseResponse>(
      `${process.env.API_URL}/${rota}?${contagemParams}`,
      `Erro ao contar ${lado === 'vendas' ? 'pedidos' : 'notas'}`,
      { headers, cache: 'no-store' }
    ).catch(() => null);
    somaQtd += contagem?.total ?? 0;
  }

  // Meta total é da empresa/consolidado, não por vendedor — uma chamada só,
  // sem filtro de codigo_empresa (mesmo padrão que corrigiu o bug "meta não
  // aparecia" nos dashboards de admin).
  const dashboardMensal = await apiFetch<DashboardMensalResponse>(
    `${process.env.API_URL}/dashboard_mensal_${lado}?mes=${mes}&ano=${ano}`,
    `Erro ao buscar meta total de ${lado}`,
    { headers, cache: 'no-store' }
  ).catch(() => null);
  const metaTotal =
    Number(dashboardMensal?.consolidado?.meta ?? dashboardMensal?.data?.[0]?.meta) || 0;

  return {
    vendedor: vendedorNome,
    valor: somaValor,
    quantidade: somaQtd,
    meta_individual: somaMetaIndividual,
    meta_total: metaTotal,
    perc_meta: somaMetaIndividual > 0 ? (somaValor / somaMetaIndividual) * 100 : 0,
    perc_participacao: metaTotal > 0 ? (somaValor / metaTotal) * 100 : 0,
  };
}

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

    const [vendas, faturamento, classificacaoPedidos, meusTopClientes] = await Promise.all([
      somarLado('vendas', vendedores, mes, ano, headers),
      somarLado('faturamento', vendedores, mes, ano, headers),
      classificarPedidos(vendedores, mes, ano, headers),
      topClientes(vendedores, mes, ano, headers),
    ]);

    return NextResponse.json({
      vinculado: true,
      mes: Number(mes),
      ano: Number(ano),
      vendas,
      faturamento,
      classificacaoPedidos,
      topClientes: meusTopClientes,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
