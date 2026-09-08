// Regra de SLA de pedido — seção 5 do plano do Portal do Vendedor
// (docs/portal-vendedor/plano-portal-vendedor.md). Calcula a urgência a
// partir dos dias restantes até `data_previsao`; a página decide como
// estilizar cada nível (cor/ícone), este módulo só decide QUAL nível.
export type SlaTier = 'atrasado' | 'vence-hoje' | 'falta-1-dia' | 'falta-2-dias' | 'falta-3-dias' | 'normal';

export interface SlaInfo {
  tier: SlaTier;
  dias: number;
  texto: string;
}

// Só calcula se `dataPrevisao` vier preenchido e o pedido não estiver faturado.
export function calcularSlaPedido(dataPrevisao: string | null, faturado: boolean): SlaInfo | null {
  if (faturado || !dataPrevisao) return null;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const previsao = new Date(dataPrevisao);
  previsao.setHours(0, 0, 0, 0);
  const dias = Math.round((previsao.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

  if (dias < 0) {
    return { tier: 'atrasado', dias, texto: `⛔ Atrasado — ${-dias} dia${-dias === 1 ? '' : 's'}` };
  }
  if (dias === 0) return { tier: 'vence-hoje', dias, texto: '⚠ Vence hoje' };
  if (dias === 1) return { tier: 'falta-1-dia', dias, texto: '⚠ Falta 1 dia' };
  if (dias === 2) return { tier: 'falta-2-dias', dias, texto: `Faltam ${dias} dias` };
  if (dias === 3) return { tier: 'falta-3-dias', dias, texto: `Faltam ${dias} dias` };
  return { tier: 'normal', dias, texto: `Previsão em ${dias} dias` };
}
