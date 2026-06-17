interface GetPerfisParams {
  page?: number;
  limit?: number;
  nome?: string;
}

export async function getPerfis(params: GetPerfisParams = {}) {
  const query = new URLSearchParams();

  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.nome) query.set('nome', params.nome);

  const res = await fetch(`/api/perfis?${query}`);
  if (!res.ok) throw new Error('Erro ao buscar perfis');
  return res.json();
}

export async function criarPerfil(data: object) {
  const res = await fetch('/api/perfis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Erro ao criar perfil');
  return res.json();
}

export async function editarPerfil(id: string, data: object) {
  const res = await fetch(`/api/perfis/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Erro ao atualizar perfil');
  return res.json();
}
