import { apiFetch } from '@/lib/api/fetchHelper';

export async function getPriceHistory(produto: string = '', parceiro: string = '') {
  return apiFetch(
    `/api/produtos/historico?produto=${produto}&parceiro=${parceiro}`,
    'Erro ao buscar histórico de preços'
  );
}
