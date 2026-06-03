export async function getTodosFornecedores(nome: string = '') {
  const res = await fetch(`/api/parceiros/todosFornecedores`);
  if (!res.ok) {
    throw new Error('Erro ao buscar todos fornecedores');
  }
  return res.json();
}