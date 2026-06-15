export async function getCargos() {
  const res = await fetch('/api/referenciais/cargos');
  if (!res.ok) throw new Error('Erro ao buscar cargos');
  return res.json();
}

export async function getSetores() {
  const res = await fetch('/api/referenciais/setores');
  if (!res.ok) throw new Error('Erro ao buscar setores');
  return res.json();
}

export async function getUnidades() {
  const res = await fetch('/api/referenciais/unidades');
  if (!res.ok) throw new Error('Erro ao buscar unidades');
  return res.json();
}
