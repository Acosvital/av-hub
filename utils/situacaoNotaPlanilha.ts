import { NotaPlanilhaProps } from '@/app/(protected)/notas-equipe/types';

export interface SituacaoBadgeProps {
  chave: string;
  label: string;
  cor: string;
}

// /faturamento_planilha é a view CRUA — as flags são do PEDIDO vinculado à
// NF, não da nota em si, e não são mutuamente exclusivas (uma NF pode estar
// autorizada, faturada E cancelada ao mesmo tempo: o pedido foi faturado e
// só depois cancelado). Escolhe 1 badge só — o status FINAL — na mesma
// ordem de precedência das deduções do resumo/waterfall (Cancelado >
// Devolvido > Devolvido parcial > Recusado), com os estados que o waterfall
// não cobre completando pelo mesmo raciocínio: mais definitivo primeiro.
const SITUACOES: Array<{ campo: keyof NotaPlanilhaProps; label: string; cor: string }> = [
  { campo: 'cancelado', label: 'Cancelado', cor: 'var(--red)' },
  { campo: 'devolvido', label: 'Devolvido', cor: 'var(--orange)' },
  { campo: 'devolucao_parcial', label: 'Devolução parcial', cor: 'var(--orange-light)' },
  { campo: 'denegado', label: 'Denegado', cor: 'var(--red-light)' },
  { campo: 'encerrado', label: 'Encerrado', cor: 'var(--gray)' },
  { campo: 'faturado', label: 'Faturado', cor: 'var(--green)' },
  { campo: 'manual_nf', label: 'Manual (NF)', cor: 'var(--purple)' },
  { campo: 'manual_pedido', label: 'Manual (pedido)', cor: 'var(--purple)' },
  { campo: 'autorizado', label: 'Autorizado', cor: 'var(--blue)' },
];

export function situacaoBadgesNota(nota: NotaPlanilhaProps): SituacaoBadgeProps[] {
  const situacao = SITUACOES.find((s) => Boolean(nota[s.campo]));
  if (!situacao) return [];
  return [{ chave: situacao.campo, label: situacao.label, cor: situacao.cor }];
}
