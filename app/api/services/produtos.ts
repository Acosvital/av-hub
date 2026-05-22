export async function getProdutos() {
  const res = await fetch('/api/produtos');

  if (!res.ok) {
    throw new Error('Erro ao buscar produtos');
  }

  return res.json();
}