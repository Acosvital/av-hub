import { apiFetch } from '@/lib/api/fetchHelper';

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

export type TipoContrato = 'SPOT' | 'CONTRATO' | 'SEM CLASSIFICAÇÃO';

interface VendaBaseLinhaProps {
  tipo_contrato: TipoContrato | null;
  total_pedido: string | null;
}

interface VendasBaseResponse {
  total: number;
  data: VendaBaseLinhaProps[];
}

export type Lado = 'vendas' | 'faturamento';

export interface VendedorVinculoProps {
  codigo_vendedor_omie: string;
  codigo_empresa: string;
}

interface UnidadeLinhaProps {
  id: string;
  nome_fantasia: string;
}

// Um vendedor pode ter vínculo em mais de uma unidade (ex.: matriz Mogi +
// filial Uberaba) — top clientes/produtos/clientes inativos agregam os
// vínculos SEM mesclar linhas de unidades diferentes (ver contrato interno:
// mesmo cliente/produto em 2 unidades são vendas DIFERENTES, não a mesma
// linha duplicada). Esse mapa id -> nome_fantasia resolve o rótulo exibido
// pra cada linha. Só 3 unidades hoje — 1 chamada, direto no backend (não
// via /api/unidades, que exige a permissão 'unidades', que um vendedor
// comum não tem).
export async function nomesUnidades(headers: Record<string, string>): Promise<Map<string, string>> {
  // Falha aqui degrada pro fallback `unidades.get(...) ?? codigo_empresa` em
  // quem consome o mapa (mostra o código cru em vez do nome) — não deixa a
  // página inteira quebrar, mas precisa ficar visível no log do servidor,
  // não sumir silenciosamente (falha de rede não passa pelo console.error
  // que apiFetch já dá em erro HTTP, só em erro HTTP mesmo).
  const resposta = await apiFetch<{ unidades: UnidadeLinhaProps[] }>(
    `${process.env.API_URL}/unidades?limit=100`,
    'Erro ao buscar nomes das unidades',
    { headers, cache: 'no-store' }
  ).catch((err) => {
    console.error('Erro ao buscar nomes das unidades — linhas vão cair no fallback de código cru', err);
    return null;
  });

  return new Map((resposta?.unidades ?? []).map((u) => [u.id, u.nome_fantasia]));
}

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
export async function classificarPedidos(
  vendedores: VendedorVinculoProps[],
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
  codigo_cliente?: string;
  vendas: string;
  qtd_pedidos: string;
}

interface RankingClientesResponse {
  data: RankingClienteLinhaProps[];
}

export interface TopClienteProps {
  cliente: string;
  codigo_cliente?: string;
  codigo_empresa: string;
  unidade: string;
  valor: number;
  qtd_pedidos: number;
}

// Top clientes do vendedor no mês — seção 8.5 do plano, liberada pelo
// contrato 003 (cod_vendedor em ranking_clientes_vendas). Pega o ranking já
// pronto de cada empresa (sem paginar tudo — 20 já cobre o top real). Um
// vendedor com vínculo em 2 unidades e o MESMO cliente comprando nas duas
// gera 2 linhas de propósito (vendas de unidades diferentes, cada uma com
// seu próprio codigo_cliente/faturamento) — não mescla, só rotula cada
// linha com a unidade de origem (ver nomesUnidades). Busca até 20 por
// unidade (não só os 5 exibidos por padrão) pra alimentar o "ver mais" na
// tela sem precisar de uma segunda chamada.
export async function topClientes(
  vendedores: VendedorVinculoProps[],
  mes: string,
  ano: string,
  headers: Record<string, string>,
  unidades: Map<string, string>
): Promise<TopClienteProps[]> {
  const listas = await Promise.all(
    vendedores.map((v) => {
      const params = new URLSearchParams({
        mes,
        ano,
        codigo_empresa: v.codigo_empresa,
        cod_vendedor: v.codigo_vendedor_omie,
        limit: '20',
      });
      return apiFetch<RankingClientesResponse>(
        `${process.env.API_URL}/ranking_clientes_vendas?${params}`,
        'Erro ao buscar top clientes',
        { headers, cache: 'no-store' }
      )
        .then((r) => (r.data ?? []).map((c) => ({ ...c, codigo_empresa: v.codigo_empresa })))
        .catch(() => []);
    })
  );

  return listas
    .flat()
    .map((c) => ({
      cliente: c.cliente,
      codigo_cliente: c.codigo_cliente,
      codigo_empresa: c.codigo_empresa,
      unidade: unidades.get(c.codigo_empresa) ?? c.codigo_empresa,
      valor: Number(c.vendas) || 0,
      qtd_pedidos: Number(c.qtd_pedidos) || 0,
    }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 20);
}

interface PedidoClienteBrutoProps {
  codigo_pedido_omie: string;
  numero_pedido: string | null;
  data_inclusao: string | null;
  total_pedido: string | null;
  tipo_contrato: TipoContrato | null;
  codigo_cliente: string | null;
  etapa_descricao: string | null;
}

export interface PedidoClienteProps {
  codigo_pedido_omie: string;
  numero_pedido: string | null;
  data_inclusao: string | null;
  total_pedido: number;
  tipo_contrato: TipoContrato | null;
  etapa_descricao: string | null;
}

// Lista de pedidos de UM cliente específico, no mês, pro modal de detalhes
// (clique num cliente em "Meus melhores clientes"/"Clientes sem comprar").
// `vendas_base?codigo_cliente=X` existe como parâmetro mas é ignorado pela
// API (confirmado ao vivo, 06/09 — o filtro não tem efeito nenhum no
// resultado) — busca os pedidos do vendedor no mês (já teto em 1000, mesmo
// limite usado em classificarPedidos) e filtra pelo cliente no servidor
// Next.js mesmo.
export async function pedidosDoCliente(
  vendedores: VendedorVinculoProps[],
  codigoCliente: string,
  mes: string,
  ano: string,
  headers: Record<string, string>
): Promise<PedidoClienteProps[]> {
  const { dataInicio, dataFim } = intervaloDoMes(mes, ano);

  const listas = await Promise.all(
    vendedores.map((v) => {
      const params = new URLSearchParams({
        cod_vendedor: v.codigo_vendedor_omie,
        codigo_empresa: v.codigo_empresa,
        data_inicio: dataInicio,
        data_fim: dataFim,
        limit: '1000',
      });
      return apiFetch<{ data: PedidoClienteBrutoProps[] }>(
        `${process.env.API_URL}/vendas_base?${params}`,
        'Erro ao buscar pedidos do cliente',
        { headers, cache: 'no-store' }
      )
        .then((r) => r.data ?? [])
        .catch(() => []);
    })
  );

  return listas
    .flat()
    .filter((p) => p.codigo_cliente === codigoCliente)
    .map((p) => ({
      codigo_pedido_omie: p.codigo_pedido_omie,
      numero_pedido: p.numero_pedido,
      data_inclusao: p.data_inclusao,
      total_pedido: Number(p.total_pedido) || 0,
      tipo_contrato: p.tipo_contrato,
      etapa_descricao: p.etapa_descricao,
    }))
    .sort((a, b) => String(b.data_inclusao).localeCompare(String(a.data_inclusao)));
}

interface PedidoVencimentoBrutoProps {
  codigo_pedido_omie: number;
  numero_pedido: string | null;
  nome_cliente: string | null;
  razao_social_cliente: string | null;
  codigo_cliente: string | null;
  // Renomeado no backend pra previsao_faturamento (era data_previsao) — só
  // o nome cru vindo de /vendas_base; ProximoVencimentoProps abaixo continua
  // se chamando data_previsao (contrato de saída deste módulo).
  previsao_faturamento: string | null;
  faturado: boolean;
  total_pedido: string | null;
  etapa_descricao: string | null;
}

export interface ProximoVencimentoProps {
  codigo_pedido_omie: number;
  numero_pedido: string | null;
  cliente: string;
  codigo_cliente: string | null;
  data_previsao: string;
  total_pedido: number;
  etapa_descricao: string | null;
}

// "Próximos vencimentos" (seção 8.4 do plano) — mesmos dados que "Meus
// Pedidos" já busca (vendas_base), só que ordenados por data_previsao
// ascendente e cortados no topo. Pedido já vencido (data no passado) tem
// data_previsao menor, então naturalmente aparece primeiro — é o mais
// urgente, mesma leitura usada no selo de SLA de Meus Pedidos.
export async function proximosVencimentos(
  vendedores: VendedorVinculoProps[],
  mes: string,
  ano: string,
  headers: Record<string, string>,
  limite = 5
): Promise<ProximoVencimentoProps[]> {
  const { dataInicio, dataFim } = intervaloDoMes(mes, ano);

  const listas = await Promise.all(
    vendedores.map((v) => {
      const params = new URLSearchParams({
        cod_vendedor: v.codigo_vendedor_omie,
        codigo_empresa: v.codigo_empresa,
        data_inicio: dataInicio,
        data_fim: dataFim,
        limit: '1000',
      });
      return apiFetch<{ data: PedidoVencimentoBrutoProps[] }>(
        `${process.env.API_URL}/vendas_base?${params}`,
        'Erro ao buscar próximos vencimentos',
        { headers, cache: 'no-store' }
      )
        .then((r) => r.data ?? [])
        .catch(() => []);
    })
  );

  return listas
    .flat()
    .filter((p) => !p.faturado && p.previsao_faturamento)
    .map((p) => ({
      codigo_pedido_omie: p.codigo_pedido_omie,
      numero_pedido: p.numero_pedido,
      cliente: p.nome_cliente ?? p.razao_social_cliente ?? p.codigo_cliente ?? '—',
      codigo_cliente: p.codigo_cliente,
      data_previsao: p.previsao_faturamento as string,
      total_pedido: Number(p.total_pedido) || 0,
      etapa_descricao: p.etapa_descricao,
    }))
    .sort((a, b) => a.data_previsao.localeCompare(b.data_previsao))
    .slice(0, limite);
}

interface ItemPedidoBrutoProps {
  codigo_produto: string;
  descricao: string | null;
  quantidade: number | string | null;
  valor_total: string | null;
}

export interface TopProdutoProps {
  codigo_produto: string;
  codigo_empresa: string;
  unidade: string;
  descricao: string;
  quantidade: number;
  valor: number;
}

// Top produtos vendidos (seção 8.12 do plano) — agrega no frontend a partir
// de `GET /pedido_venda_itens` (view já existente, confirmada em
// docs/portal-vendedor/002, item "Nota sobre top produtos vendidos"). Não
// existe endpoint de ranking pronto — o volume mensal de 1 vendedor é
// pequeno o bastante pra agregação client-side ser barata (mesmo raciocínio
// já usado em classificarPedidos). Agrega por (codigo_empresa, codigo_produto)
// — o MESMO produto vendido em 2 unidades vira 2 linhas rotuladas por
// unidade, não uma linha só somando tudo (mesmo raciocínio de topClientes:
// vendas de unidades diferentes não são "a mesma linha").
export async function topProdutos(
  vendedores: VendedorVinculoProps[],
  mes: string,
  ano: string,
  headers: Record<string, string>,
  unidades: Map<string, string>,
  limite = 20
): Promise<TopProdutoProps[]> {
  const { dataInicio, dataFim } = intervaloDoMes(mes, ano);

  const listas = await Promise.all(
    vendedores.map((v) => {
      const params = new URLSearchParams({
        codigo_vendedor_omie: v.codigo_vendedor_omie,
        data_inicio: dataInicio,
        data_fim: dataFim,
        limit: '1000',
      });
      return apiFetch<{ itens: ItemPedidoBrutoProps[] }>(
        `${process.env.API_URL}/pedido_venda_itens?${params}`,
        'Erro ao buscar top produtos',
        { headers, cache: 'no-store' }
      )
        .then((r) => (r.itens ?? []).map((item) => ({ ...item, codigo_empresa: v.codigo_empresa })))
        .catch(() => []);
    })
  );

  const porProduto = new Map<string, TopProdutoProps>();
  for (const item of listas.flat()) {
    const chave = `${item.codigo_empresa}:${item.codigo_produto}`;
    const atual = porProduto.get(chave) ?? {
      codigo_produto: item.codigo_produto,
      codigo_empresa: item.codigo_empresa,
      unidade: unidades.get(item.codigo_empresa) ?? item.codigo_empresa,
      descricao: item.descricao ?? item.codigo_produto,
      quantidade: 0,
      valor: 0,
    };
    atual.quantidade += Number(item.quantidade) || 0;
    atual.valor += Number(item.valor_total) || 0;
    porProduto.set(chave, atual);
  }

  return [...porProduto.values()].sort((a, b) => b.valor - a.valor).slice(0, limite);
}

// mes/ano do mês anterior ao informado — só usado pra "comparação com o mês
// anterior" (seção 8.3), lida com virada de ano (janeiro → dezembro do ano
// passado).
export function mesAnterior(mes: string, ano: string): { mes: string; ano: string } {
  const m = Number(mes);
  const a = Number(ano);
  return m === 1 ? { mes: '12', ano: String(a - 1) } : { mes: String(m - 1), ano: String(a) };
}

export async function somarLado(
  lado: Lado,
  vendedores: VendedorVinculoProps[],
  mes: string,
  ano: string,
  headers: Record<string, string>
) {
  const { dataInicio, dataFim } = intervaloDoMes(mes, ano);
  let vendedorNome = '';
  let somaValor = 0;
  let metaIndividual = 0;
  let metaIndividualDefinida = false;
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
      // meta_individual é da empresa toda, igual em todos os vínculos da mesma
      // pessoa (bug de divisor isolado por unidade já corrigido no backend,
      // ver docs/ENVIAR - contrato-meta-individual-divisor-incorreto.md,
      // seção 4) — pega uma vez só, nunca soma entre vínculos. Flag própria
      // (não checagem de falsy) pra um 0 legítimo do primeiro vínculo não
      // ser confundido com "ainda não veio" e sobrescrito pelo próximo.
      if (!metaIndividualDefinida) {
        metaIndividual = Number(linha.meta_individual) || 0;
        metaIndividualDefinida = true;
      }
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
    meta_individual: metaIndividual,
    meta_total: metaTotal,
    perc_meta: metaIndividual > 0 ? (somaValor / metaIndividual) * 100 : 0,
    perc_participacao: metaTotal > 0 ? (somaValor / metaTotal) * 100 : 0,
  };
}
