interface GetPermissoesParams {
  page?: number;
  limit?: number;
  id_perfil?: string;
  id_tela?: string;
}

export async function getPermissoes(params: GetPermissoesParams = {}) {
  const query = new URLSearchParams();

  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.id_perfil) query.set('id_perfil', params.id_perfil);
  if (params.id_tela) query.set('id_tela', params.id_tela);

  const res = await fetch(`/api/permissoes?${query}`);
  if (!res.ok) throw new Error('Erro ao buscar permissões');
  return res.json();
}

export async function criarPermissao(data: object) {
  const res = await fetch('/api/permissoes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Erro ao criar permissão');
  return res.json();
}

export async function editarPermissao(id: string, data: object) {
  const res = await fetch(`/api/permissoes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Erro ao atualizar permissão');
  return res.json();
}
