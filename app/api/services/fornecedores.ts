export async function getFornecedores(nome: string = '') {
  const res = await fetch(`/api/fornecedores?search=${nome}`);
  if (!res.ok) {
    throw new Error('Erro ao buscar fornecedores');
  }
  return res.json();
}