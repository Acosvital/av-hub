export async function getProdutos(page: number = 0, limit: number = 10, fornecedores: string = '', familia: string = '', descricao: string = '') {
  const res = await fetch(`/api/produtos?page=${page}&limit=${limit}&fornecedor=${fornecedores}&familia=${familia}&descricao=${descricao}`);

  if (!res.ok) {
    throw new Error('Erro ao buscar produtos');
  }

  return res.json();
}