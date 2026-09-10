import { PedidoPlanilhaProps } from '@/app/(protected)/pedidos-equipe/types';

export interface SituacaoBadgeProps {
  chave: string;
  label: string;
  cor: string;
}

// /vendas_planilha é a view CRUA — as flags não são mutuamente exclusivas
// (um pedido pode ser autorizado, faturado E cancelado ao mesmo tempo: foi
// faturado e depois cancelado, por exemplo). Mostrar todas juntas confundia
// mais do que ajudava — o que importa é o status FINAL do pedido, então a
// prioridade abaixo escolhe só 1 badge por pedido, na mesma ordem de
// precedência das deduções do resumo/waterfall (Cancelado > Devolvido >
// Devolvido parcial > Recusado), com os estados que o waterfall não cobre
// (Encerrado/Faturado/Manual/Autorizado) completando pelo mesmo raciocínio:
// mais definitivo primeiro, "Autorizado" por último (é o estado mais comum
// e menos informativo quando sozinho).
const SITUACOES: Array<{ campo: keyof PedidoPlanilhaProps; label: string; cor: string }> = [
  { campo: 'cancelado', label: 'Cancelado', cor: 'var(--red)' },
  { campo: 'devolvido', label: 'Devolvido', cor: 'var(--orange)' },
  // --orange/--danger (não as variantes "-light") — esses badges são texto
  // puro sem fundo próprio; as variantes "-light" são pensadas pra contraste
  // sobre superfície escura/colorida e ficavam quase ilegíveis no tema claro.
  { campo: 'devolucao_parcial', label: 'Devolução parcial', cor: 'var(--orange)' },
  { campo: 'denegado', label: 'Denegado', cor: 'var(--danger)' },
  { campo: 'encerrado', label: 'Encerrado', cor: 'var(--gray)' },
  { campo: 'faturado', label: 'Faturado', cor: 'var(--green)' },
  { campo: 'manual', label: 'Manual', cor: 'var(--purple)' },
  { campo: 'autorizado', label: 'Autorizado', cor: 'var(--blue)' },
];

export function situacaoBadges(pedido: PedidoPlanilhaProps): SituacaoBadgeProps[] {
  const situacao = SITUACOES.find((s) => Boolean(pedido[s.campo]));
  if (!situacao) return [];
  return [{ chave: situacao.campo, label: situacao.label, cor: situacao.cor }];
}
