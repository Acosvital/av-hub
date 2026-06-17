export async function getFamilias() {
  const res = await fetch('/api/familias');

  if (!res.ok) {
    throw new Error('Erro ao buscar famílias de produtos');
  }

  return res.json();
}