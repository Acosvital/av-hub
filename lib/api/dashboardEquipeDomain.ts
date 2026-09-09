import { apiFetch } from '@/lib/api/fetchHelper';
import { nomesUnidades, mesAnterior, TipoContrato } from '@/lib/api/meuDashboardDomain';

export { nomesUnidades, mesAnterior };

// Dashboard da Equipe é "todos os vendedores juntos" (empresa inteira), não
// 1 pessoa por vez — por isso usa os MESMOS endpoints agregados que o
// dashboard admin (dash-vendas/dash-faturamento) já usa, em vez de repetir o
// padrão do Portal do Vendedor (1 chamada por vínculo de vendedor, que não
// escala pra ~100 vendedores). Cada função aqui é 1 chamada só, sem loop.

interface DashboardMensalConsolidadoProps {
  vendas_total?: string;
  faturamento_total?: string;
  qtd_pedidos?: string;
  qtd_nfs?: string;
  vendas_mes_anterior?: string;
  fat_mes_anterior?: string;
  qtd_pedidos_mes_anterior?: string;
  qtd_nfs_mes_anterior?: string;
  meta: string;
  perc_atingimento: string;
  vendas_hoje?: string;
  fat_hoje?: string;
  pedidos_hoje: string;
}

interface DashboardMensalResponse {
  consolidado: DashboardMensalConsolidadoProps;
}

export interface ResumoEmpresaProps {
  valor: number;
  quantidade: number;
  valorMesAnterior: number;
  quantidadeMesAnterior: number;
  meta: number;
  percAtingimento: number;
  valorHoje: number;
  pedidosHoje: number;
}

export type Lado = 'vendas' | 'faturamento';

export async function resumoEmpresa(
  lado: Lado,
  mes: string,
  ano: string,
  headers: Record<string, string>
): Promise<ResumoEmpresaProps> {
  const recurso = lado === 'vendas' ? 'dashboard_mensal_vendas' : 'dashboard_mensal_faturamento';
  const resposta = await apiFetch<DashboardMensalResponse>(
    `${process.env.API_URL}/${recurso}?mes=${mes}&ano=${ano}`,
    `Erro ao buscar resumo de ${lado} da empresa`,
    { headers, cache: 'no-store' }
  ).catch(() => null);

  const c = resposta?.consolidado;
  if (!c) {
    return {
      valor: 0,
      quantidade: 0,
      valorMesAnterior: 0,
      quantidadeMesAnterior: 0,
      meta: 0,
      percAtingimento: 0,
      valorHoje: 0,
      pedidosHoje: 0,
    };
  }

  return {
    valor: Number(lado === 'vendas' ? c.vendas_total : c.faturamento_total) || 0,
    quantidade: Number(lado === 'vendas' ? c.qtd_pedidos : c.qtd_nfs) || 0,
    valorMesAnterior: Number(lado === 'vendas' ? c.vendas_mes_anterior : c.fat_mes_anterior) || 0,
    quantidadeMesAnterior:
      Number(lado === 'vendas' ? c.qtd_pedidos_mes_anterior : c.qtd_nfs_mes_anterior) || 0,
    meta: Number(c.meta) || 0,
    percAtingimento: Number(c.perc_atingimento) || 0,
    valorHoje: Number(lado === 'vendas' ? c.vendas_hoje : c.fat_hoje) || 0,
    pedidosHoje: Number(c.pedidos_hoje) || 0,
  };
}

interface VendasPorTipoLinhaProps {
  tipo_contrato: TipoContrato;
  vendas: string;
  qtd_pedidos: string;
}

interface VendasPorTipoResponse {
  data: Record<string, VendasPorTipoLinhaProps[]>[];
}

// vendas_por_tipo_contrato devolve 1 objeto por mês pedido, chaveado por
// "MM/AAAA" (só pedimos 1 mês, então só existe 1 chave) — extrai o array de
// dentro dessa chave sem precisar adivinhar o formato exato da string.
export async function classificacaoPedidosEmpresa(
  mes: string,
  ano: string,
  headers: Record<string, string>
): Promise<Record<TipoContrato, { quantidade: number; valor: number }>> {
  const contagem: Record<TipoContrato, { quantidade: number; valor: number }> = {
    SPOT: { quantidade: 0, valor: 0 },
    CONTRATO: { quantidade: 0, valor: 0 },
    'SEM CLASSIFICAÇÃO': { quantidade: 0, valor: 0 },
  };

  const resposta = await apiFetch<VendasPorTipoResponse>(
    `${process.env.API_URL}/vendas_por_tipo_contrato?mes=${mes}&ano=${ano}`,
    'Erro ao buscar classificação dos pedidos da empresa',
    { headers, cache: 'no-store' }
  ).catch(() => null);

  const grupoDoMes = resposta?.data?.[0];
  const linhas = grupoDoMes ? Object.values(grupoDoMes)[0] ?? [] : [];
  for (const linha of linhas) {
    contagem[linha.tipo_contrato] = {
      quantidade: Number(linha.qtd_pedidos) || 0,
      valor: Number(linha.vendas) || 0,
    };
  }
  return contagem;
}

interface RankingClienteEmpresaLinhaProps {
  cliente: string;
  codigo_cliente?: string;
  codigo_empresa: string;
  vendas: string;
  qtd_pedidos: string;
}

interface RankingClientesEmpresaResponse {
  data: RankingClienteEmpresaLinhaProps[];
}

export interface TopClienteEmpresaProps {
  cliente: string;
  codigo_cliente?: string;
  codigo_empresa: string;
  unidade: string;
  valor: number;
  qtd_pedidos: number;
}

export async function topClientesEmpresa(
  mes: string,
  ano: string,
  headers: Record<string, string>,
  unidades: Map<string, string>,
  limite = 20
): Promise<TopClienteEmpresaProps[]> {
  const resposta = await apiFetch<RankingClientesEmpresaResponse>(
    `${process.env.API_URL}/ranking_clientes_vendas?mes=${mes}&ano=${ano}&limit=${limite}`,
    'Erro ao buscar top clientes da empresa',
    { headers, cache: 'no-store' }
  ).catch(() => null);

  return (resposta?.data ?? []).map((c) => ({
    cliente: c.cliente,
    codigo_cliente: c.codigo_cliente,
    codigo_empresa: c.codigo_empresa,
    unidade: unidades.get(c.codigo_empresa) ?? c.codigo_empresa,
    valor: Number(c.vendas) || 0,
    qtd_pedidos: Number(c.qtd_pedidos) || 0,
  }));
}

interface ItemPedidoEmpresaBrutoProps {
  codigo_produto: string;
  descricao: string | null;
  quantidade: number | string | null;
  valor_total: string | null;
}

export interface TopProdutoEmpresaProps {
  codigo_produto: string;
  descricao: string;
  quantidade: number;
  valor: number;
}

// Produto vendido em mais de 1 unidade soma num total só aqui (diferente do
// Portal do Vendedor, onde cada unidade é o vínculo de UMA pessoa e por isso
// fica separado) — pra "produtos mais vendidos da empresa" faz sentido ser
// um ranking global único.
export async function topProdutosEmpresa(
  mes: string,
  ano: string,
  headers: Record<string, string>,
  limite = 20
): Promise<TopProdutoEmpresaProps[]> {
  const { dataInicio, dataFim } = intervaloDoMes(mes, ano);
  const resposta = await apiFetch<{ itens: ItemPedidoEmpresaBrutoProps[] }>(
    `${process.env.API_URL}/pedido_venda_itens?data_inicio=${dataInicio}&data_fim=${dataFim}&limit=2000`,
    'Erro ao buscar top produtos da empresa',
    { headers, cache: 'no-store' }
  ).catch(() => null);

  const porProduto = new Map<string, TopProdutoEmpresaProps>();
  for (const item of resposta?.itens ?? []) {
    const atual = porProduto.get(item.codigo_produto) ?? {
      codigo_produto: item.codigo_produto,
      descricao: item.descricao ?? item.codigo_produto,
      quantidade: 0,
      valor: 0,
    };
    atual.quantidade += Number(item.quantidade) || 0;
    atual.valor += Number(item.valor_total) || 0;
    porProduto.set(item.codigo_produto, atual);
  }

  return [...porProduto.values()].sort((a, b) => b.valor - a.valor).slice(0, limite);
}

interface PedidoVencimentoEmpresaBrutoProps {
  codigo_pedido_omie: number;
  numero_pedido: string | null;
  nome_cliente: string | null;
  razao_social_cliente: string | null;
  codigo_cliente: string | null;
  data_previsao: string | null;
  faturado: boolean;
  total_pedido: string | null;
  etapa_descricao: string | null;
  vendedor: string | null;
}

export interface ProximoVencimentoEmpresaProps {
  codigo_pedido_omie: number;
  numero_pedido: string | null;
  cliente: string;
  codigo_cliente: string | null;
  data_previsao: string;
  total_pedido: number;
  etapa_descricao: string | null;
  vendedor: string | null;
}

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

export async function proximosVencimentosEmpresa(
  mes: string,
  ano: string,
  headers: Record<string, string>,
  limite = 5
): Promise<ProximoVencimentoEmpresaProps[]> {
  const { dataInicio, dataFim } = intervaloDoMes(mes, ano);
  const resposta = await apiFetch<{ data: PedidoVencimentoEmpresaBrutoProps[] }>(
    `${process.env.API_URL}/vendas_base?data_inicio=${dataInicio}&data_fim=${dataFim}&limit=1000`,
    'Erro ao buscar próximos vencimentos da empresa',
    { headers, cache: 'no-store' }
  ).catch(() => null);

  return (resposta?.data ?? [])
    .filter((p) => !p.faturado && p.data_previsao)
    .map((p) => ({
      codigo_pedido_omie: p.codigo_pedido_omie,
      numero_pedido: p.numero_pedido,
      cliente: p.nome_cliente ?? p.razao_social_cliente ?? p.codigo_cliente ?? '—',
      codigo_cliente: p.codigo_cliente,
      data_previsao: p.data_previsao as string,
      total_pedido: Number(p.total_pedido) || 0,
      etapa_descricao: p.etapa_descricao,
      vendedor: p.vendedor,
    }))
    .sort((a, b) => a.data_previsao.localeCompare(b.data_previsao))
    .slice(0, limite);
}

export interface ClienteInativoEmpresaProps {
  codigo_empresa: string;
  unidade: string;
  cod_vendedor: string;
  vendedor: string;
  codigo_cliente: string;
  cliente: string;
  ultima_compra: string;
  dias_sem_comprar: number;
  valor_ultima_compra: string;
  qtd_pedidos: string;
  valor_total_historico: string;
}

export async function clientesInativosEmpresa(
  diasSemComprar: string,
  headers: Record<string, string>,
  unidades: Map<string, string>,
  limite = 50
): Promise<ClienteInativoEmpresaProps[]> {
  const resposta = await apiFetch<{ data: Omit<ClienteInativoEmpresaProps, 'unidade'>[] }>(
    `${process.env.API_URL}/clientes_inativos?dias_sem_comprar=${diasSemComprar}&limit=1000`,
    'Erro ao buscar clientes inativos da empresa',
    { headers, cache: 'no-store' }
  ).catch(() => null);

  return (resposta?.data ?? [])
    .map((c) => ({ ...c, unidade: unidades.get(c.codigo_empresa) ?? c.codigo_empresa }))
    .sort((a, b) => b.dias_sem_comprar - a.dias_sem_comprar)
    .slice(0, limite);
}

interface LinhaResumoPlanilhaBrutoProps {
  codigo_empresa: string;
  ordem: number;
  secao: string;
  tipo: string;
  rotulo: string;
  grupo: string | null;
  valor: string;
  qtd_pedidos: string | null;
  pct_total: string;
}

export interface LinhaResumoPlanilhaProps {
  ordem: number;
  secao: string;
  tipo: string;
  rotulo: string;
  grupo: string | null;
  valor: number;
  qtdPedidos: number | null;
  pctTotal: number;
}

// /vendas_planilha_resumo devolve o waterfall (Bruto → Deduções → Líquido)
// UMA VEZ POR EMPRESA quando não filtra codigo_empresa (10 linhas repetidas
// por unidade, não um total já consolidado) — por isso soma valor/qtd_pedidos
// por `ordem` aqui, igual ao raciocínio de "todos os vendedores juntos" já
// usado nas outras funções deste arquivo. pct_total é recalculado depois da
// soma (o valor que a API devolve é relativo a UMA empresa só).
export async function resumoPlanilhaEmpresa(
  mes: string,
  ano: string,
  headers: Record<string, string>
): Promise<LinhaResumoPlanilhaProps[]> {
  const resposta = await apiFetch<{ data: LinhaResumoPlanilhaBrutoProps[] }>(
    `${process.env.API_URL}/vendas_planilha_resumo?mes=${mes}&ano=${ano}`,
    'Erro ao buscar resumo de pedidos da empresa',
    { headers, cache: 'no-store' }
  ).catch(() => null);

  const linhas = resposta?.data ?? [];
  const porOrdem = new Map<number, LinhaResumoPlanilhaProps>();
  for (const linha of linhas) {
    const atual = porOrdem.get(linha.ordem) ?? {
      ordem: linha.ordem,
      secao: linha.secao,
      tipo: linha.tipo,
      rotulo: linha.rotulo,
      grupo: linha.grupo,
      valor: 0,
      qtdPedidos: linha.qtd_pedidos === null ? null : 0,
      pctTotal: 0,
    };
    atual.valor += Number(linha.valor) || 0;
    if (atual.qtdPedidos !== null) atual.qtdPedidos += Number(linha.qtd_pedidos) || 0;
    porOrdem.set(linha.ordem, atual);
  }

  const consolidado = [...porOrdem.values()].sort((a, b) => a.ordem - b.ordem);
  const bruto = consolidado.find((l) => l.tipo === 'bruto')?.valor || 0;
  for (const linha of consolidado) {
    linha.pctTotal = bruto > 0 ? Math.round((linha.valor / bruto) * 1000) / 10 : 0;
  }
  return consolidado;
}

export interface PedidoClienteEmpresaProps {
  codigo_pedido_omie: string;
  numero_pedido: string | null;
  data_inclusao: string | null;
  total_pedido: number;
  tipo_contrato: TipoContrato | null;
  etapa_descricao: string | null;
  vendedor: string | null;
}

interface PedidoClienteEmpresaBrutoProps {
  codigo_pedido_omie: string;
  numero_pedido: string | null;
  data_inclusao: string | null;
  total_pedido: string | null;
  tipo_contrato: TipoContrato | null;
  codigo_cliente: string | null;
  etapa_descricao: string | null;
  vendedor: string | null;
}

// Pedidos de UM cliente no mês, pro modal de detalhes — mesmo raciocínio de
// pedidosDoCliente (Portal do Vendedor): codigo_cliente como filtro de query
// é ignorado pela API, então busca o mês inteiro e filtra no servidor Next.js.
export async function pedidosDoClienteEmpresa(
  codigoCliente: string,
  mes: string,
  ano: string,
  headers: Record<string, string>
): Promise<PedidoClienteEmpresaProps[]> {
  const { dataInicio, dataFim } = intervaloDoMes(mes, ano);
  const resposta = await apiFetch<{ data: PedidoClienteEmpresaBrutoProps[] }>(
    `${process.env.API_URL}/vendas_base?data_inicio=${dataInicio}&data_fim=${dataFim}&limit=1000`,
    'Erro ao buscar pedidos do cliente',
    { headers, cache: 'no-store' }
  ).catch(() => null);

  return (resposta?.data ?? [])
    .filter((p) => p.codigo_cliente === codigoCliente)
    .map((p) => ({
      codigo_pedido_omie: p.codigo_pedido_omie,
      numero_pedido: p.numero_pedido,
      data_inclusao: p.data_inclusao,
      total_pedido: Number(p.total_pedido) || 0,
      tipo_contrato: p.tipo_contrato,
      etapa_descricao: p.etapa_descricao,
      vendedor: p.vendedor,
    }))
    .sort((a, b) => String(b.data_inclusao).localeCompare(String(a.data_inclusao)));
}
