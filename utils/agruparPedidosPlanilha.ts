import { PedidoPlanilhaProps } from '@/app/(protected)/pedidos-equipe/types';

// /vendas_planilha é CRUA: cada sequencial/parcial de um mesmo pedido_venda
// vem como um registro independente, com seu PRÓPRIO codigo_pedido_omie
// (confirmado ao vivo: pedido_venda "27320" tem 4 sequenciais, cada um com
// um codigo_pedido_omie diferente). Isso é o que fazia um "pedido" parecer
// ter situações contraditórias — na verdade são parciais em estágios
// diferentes. Agrupa por pedido_venda (+ empresa, pra não colidir números
// repetidos entre unidades) pra mostrar 1 card por pedido, com o detalhe de
// cada parcial dentro.
export interface GrupoPedidoPlanilha {
  chave: string;
  pedidoVenda: string;
  codigoEmpresa: string;
  cliente: string;
  codigoCliente: string | null;
  vendedor: string | null;
  numeroContrato: string | null;
  categoria: string | null;
  dataInclusao: string | null;
  valorTotal: number;
  parciais: PedidoPlanilhaProps[];
}

export function agruparPorPedidoVenda(pedidos: PedidoPlanilhaProps[]): GrupoPedidoPlanilha[] {
  const grupos = new Map<string, GrupoPedidoPlanilha>();

  for (const p of pedidos) {
    const chave = `${p.codigo_empresa}:${p.pedido_venda ?? p.codigo_pedido_omie}`;
    const atual = grupos.get(chave) ?? {
      chave,
      pedidoVenda: p.pedido_venda ?? String(p.codigo_pedido_omie),
      codigoEmpresa: p.codigo_empresa,
      cliente: p.razao_social_destinatario ?? p.destinatario ?? p.codigo_cliente ?? '—',
      codigoCliente: p.codigo_cliente,
      vendedor: p.vendedor,
      numeroContrato: p.numero_contrato,
      categoria: p.categoria,
      dataInclusao: p.data_inclusao,
      valorTotal: 0,
      parciais: [],
    };
    atual.valorTotal += Number(p.total_pedido_venda) || 0;
    // Mais recente primeiro nos metadados do cabeçalho, mas mantém o
    // primeiro data_inclusao/vendedor vistos pra estabilidade se um dia
    // divergirem entre parciais.
    atual.parciais.push(p);
    grupos.set(chave, atual);
  }

  for (const grupo of grupos.values()) {
    grupo.parciais.sort((a, b) => (Number(a.sequencial) || 0) - (Number(b.sequencial) || 0));
  }

  return [...grupos.values()];
}
