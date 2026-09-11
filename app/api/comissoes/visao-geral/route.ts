import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/fetchHelper';
import { requirePermission } from '@/lib/api/requirePermission';
import { obterMesAtualSaoPaulo, primeiroEUltimoDiaDoMes } from '@/utils/mesAtualSaoPaulo';

// BFF de "Comissões > Visão Geral" — tela somente leitura de NFs faturadas
// pra acompanhamento de comissão. Não existe rota dedicada disso na
// api-avhub (nem cruzamento de dados lá): este arquivo busca a página de NFs
// líquidas em /faturamento_planilha e, pra cada linha, resolve o `sequencial`
// do pedido em /vendas_planilha, montando "numero_pedido/sequencial". Toda a
// junção acontece aqui no BFF — a api-avhub (repositório de outro
// desenvolvedor) não é tocada.
//
// A tela pede o período por mes/ano (um único MesSeletor, não mais um range
// livre de datas) — este BFF traduz mes/ano pro range data_inicio/data_fim
// que /faturamento_planilha exige (a API em si não mudou, só a forma como
// pedimos o período).
//
// REGRA DE is_track_record (por que isso importa):
// vw_faturamento_planilha e vw_vendas_planilha são UNION ALL de tabelas
// "vivas" (mês corrente, ainda podendo mudar) e tabelas "congeladas"
// (histórico.hst_*, gravadas por fn_snapshot_mensal no fechamento de cada
// mês). is_track_record=false lê a perna viva; =true lê a perna congelada.
// Um mês já fechado (mes/ano ANTERIOR ao mês/ano corrente, no fuso
// America/Sao_Paulo) só deve ser consultado com is_track_record=true: é o
// snapshot definitivo daquele mês, e comissão calculada em cima dele não
// pode ficar "flutuando" se alguém editar um pedido antigo depois. Já o mês
// corrente ainda não foi congelado, então usa is_track_record=false (dado
// vivo, o único que existe pra esse mês).
export interface VisaoGeralComissaoRow {
  // Não faz parte das colunas pedidas pela tela — existe só pra dar uma
  // chave estável de React (nota_fiscal sozinho não é garantidamente único
  // entre empresas diferentes; codigo_nf_omie é a PK da NF na Omie).
  codigo_nf_omie: number | null;
  data_emissao: string | null;
  numero_pedido: string | null;
  nota_fiscal: string | null;
  cliente: string | null;
  vendedor: string | null;
  valor_faturado: number | null;
  // Colunas de comissão: ainda não há de onde vir esse dado (nenhuma rota da
  // api-avhub calcula isso hoje) — ficam null e a tela mostra "—"/"Pendente"
  // até existir uma fonte real.
  margem_simulador: number | null;
  comissao_vendedor_pct: number | null;
  comissao_estimada: number | null;
  comissao_compras_pct: number | null;
  comissao_real_pct: number | null;
  valor_comissao_calculado: number | null;
  obs_comissao: string | null;
}

interface FaturamentoPlanilhaRow {
  codigo_nf_omie: number | null;
  codigo_empresa: string;
  data_emissao: string | null;
  pedido: string | null;
  codigo_pedido_omie: number | null;
  nota_fiscal: string | null;
  destinatario: string | null;
  vendedor: string | null;
  total_nota_fiscal_ajustado: number | string | null;
}

interface FaturamentoPlanilhaResponse {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  data: FaturamentoPlanilhaRow[];
}

interface VendasPlanilhaResponse {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  data: { sequencial: number | null }[];
}

// Cada linha da página dispara 1 chamada a /vendas_planilha em paralelo pra
// resolver o sequencial — limita o tamanho de página bem abaixo do máximo da
// api-avhub (3000) pra não abrir uma leva grande demais de requisições
// simultâneas por causa disso.
const LIMIT_PADRAO = 25;
const LIMIT_MAXIMO = 100;

export async function GET(request: NextRequest) {
  const denied = await requirePermission('visao-geral', 'pode_visualizar');
  if (denied) return denied;

  try {
    const { searchParams } = request.nextUrl;

    const mesAtual = obterMesAtualSaoPaulo();

    // mes/ano vindos do MesSeletor da tela — default = mês corrente (SP)
    // quando ausentes/inválidos, mesma regra que já valia pro range de datas.
    const mesParam = Number(searchParams.get('mes'));
    const anoParam = Number(searchParams.get('ano'));
    const mes = Number.isInteger(mesParam) && mesParam >= 1 && mesParam <= 12 ? mesParam : mesAtual.mes;
    const ano = Number.isInteger(anoParam) && anoParam > 0 ? anoParam : mesAtual.ano;

    const { primeiroDia: data_inicio, ultimoDia: data_fim } = primeiroEUltimoDiaDoMes(ano, mes);

    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(
      LIMIT_MAXIMO,
      Math.max(1, Number(searchParams.get('limit')) || LIMIT_PADRAO)
    );

    // mes/ano pedidos antes do mês/ano corrente (SP) => mês já fechado =>
    // snapshot. Antes isso exigia olhar só o fim de um intervalo arbitrário
    // (data_fim); agora que o filtro é sempre "um mês inteiro", é só comparar
    // mes/ano pedidos contra o mês/ano corrente diretamente.
    const isTrackRecord = ano < mesAtual.ano || (ano === mesAtual.ano && mes < mesAtual.mes);

    // Filtros de texto opcionais (Número do Pedido / Cliente / Vendedor),
    // repassados como os nomes que /faturamento_planilha já espera:
    // - pedido: igualdade EXATA no numero_pedido cru (sem o sequencial que
    //   este BFF concatena mais abaixo). Se o usuário digitar algo como
    //   "12345/2" (o formato que a PRÓPRIA tela exibe), usamos só a parte
    //   antes da barra — senão a busca nunca bateria com nada, já que a API
    //   não conhece o sequencial. Decisão: aceitar o formato exibido na tela
    //   em vez de exigir o usuário digitar só o número puro.
    // - cliente -> destinatario (parcial, case-insensitive na api-avhub).
    // - vendedor -> vendedor (parcial, case-insensitive na api-avhub).
    const pedidoParam = searchParams.get('pedido')?.trim();
    const pedido = pedidoParam ? pedidoParam.split('/')[0].trim() : undefined;
    const cliente = searchParams.get('cliente')?.trim() || undefined;
    const vendedor = searchParams.get('vendedor')?.trim() || undefined;

    const headers = { 'x-api-key': process.env.API_KEY! };

    const paramsFaturamento = new URLSearchParams({
      grupo: 'LIQUIDO',
      data_inicio,
      data_fim,
      is_track_record: String(isTrackRecord),
      page: String(page),
      limit: String(limit),
    });
    if (pedido) paramsFaturamento.set('pedido', pedido);
    if (cliente) paramsFaturamento.set('destinatario', cliente);
    if (vendedor) paramsFaturamento.set('vendedor', vendedor);

    const faturamento = await apiFetch<FaturamentoPlanilhaResponse>(
      `${process.env.API_URL}/faturamento_planilha?${paramsFaturamento}`,
      'Erro ao buscar faturamento (visão geral de comissões)',
      { headers, cache: 'no-store' }
    );

    const data: VisaoGeralComissaoRow[] = await Promise.all(
      faturamento.data.map(async (row) => {
        let sequencial: number | null = null;

        if (row.codigo_pedido_omie != null) {
          try {
            const paramsVendas = new URLSearchParams({
              codigo_pedido_omie: String(row.codigo_pedido_omie),
              codigo_empresa: String(row.codigo_empresa),
              is_track_record: String(isTrackRecord),
              limit: '1',
            });
            const vendas = await apiFetch<VendasPlanilhaResponse>(
              `${process.env.API_URL}/vendas_planilha?${paramsVendas}`,
              'Erro ao buscar sequencial do pedido (visão geral de comissões)',
              { headers, cache: 'no-store' }
            );
            sequencial = vendas.data[0]?.sequencial ?? null;
          } catch (err) {
            // Não deixa a tela quebrar por causa de 1 pedido sem match — só
            // mostra o número do pedido puro, sem o sequencial, pra essa linha.
            console.error(
              '[comissoes/visao-geral] erro ao resolver sequencial do pedido',
              row.codigo_pedido_omie,
              err
            );
          }
        }

        const numero_pedido = row.pedido
          ? sequencial != null
            ? `${row.pedido}/${sequencial}`
            : row.pedido
          : null;

        const valorFaturadoNumero =
          row.total_nota_fiscal_ajustado != null ? Number(row.total_nota_fiscal_ajustado) : null;

        return {
          codigo_nf_omie: row.codigo_nf_omie ?? null,
          data_emissao: row.data_emissao,
          numero_pedido,
          nota_fiscal: row.nota_fiscal,
          cliente: row.destinatario,
          vendedor: row.vendedor,
          valor_faturado:
            valorFaturadoNumero != null && !Number.isNaN(valorFaturadoNumero)
              ? valorFaturadoNumero
              : null,
          // Colunas de comissão — sem fonte de dado ainda.
          margem_simulador: null,
          comissao_vendedor_pct: null,
          comissao_estimada: null,
          comissao_compras_pct: null,
          comissao_real_pct: null,
          valor_comissao_calculado: null,
          obs_comissao: null,
        };
      })
    );

    return NextResponse.json({
      total: faturamento.total,
      page: faturamento.page,
      limit: faturamento.limit,
      total_pages: faturamento.total_pages,
      data,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
