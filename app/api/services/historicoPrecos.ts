export async function getPriceHistory(produto: string = '',parceiro: string = '') {
  const res = await fetch(`/api/produtos/historico?produto=${produto}&parceiro=${parceiro}`);
  if (!res.ok) {
    throw new Error('Erro ao buscar histórico de preços');
  }
  return res.json();
}