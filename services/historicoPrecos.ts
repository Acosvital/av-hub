import { PriceHistoryProps, PriceProps } from '@/app/(protected)/orcamento/historico-produtos/types';
import historicoPrecosData from '@/app/(protected)/orcamento/_data/historicoPrecos.json';

const historicoPrecos = historicoPrecosData as PriceProps[];

// Dados mockados — sem requisição real até existir uma API própria do módulo de compras.
export async function getPriceHistory(
  produto: string = '',
  parceiro: string = ''
): Promise<PriceHistoryProps> {
  const rows = historicoPrecos
    .filter((p) => p.id_produto === produto && p.id_parceiro === parceiro)
    .sort((a, b) => a.data_cotacao.localeCompare(b.data_cotacao));
  return { historico_precos: rows, limit: rows.length, page: 1, total: rows.length, totalPages: 1 };
}
