interface GetTelasParams {
  page?: number;
  limit?: number;
  nome?: string;
  ativo?: boolean;
  id_parent?: string | null;
}

export async function getTelas(params: GetTelasParams = {}) {
  const query = new URLSearchParams();

  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.nome) query.set('nome', params.nome);
  if (params.ativo !== undefined) query.set('ativo', String(params.ativo));
  if (params.id_parent !== undefined && params.id_parent !== null) query.set('id_parent', params.id_parent);

  const res = await fetch(`/api/telas?${query}`);
  if (!res.ok) throw new Error('Erro ao buscar telas');
  return res.json();
}

export async function criarTela(data: object) {
  const res = await fetch('/api/telas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Erro ao criar tela');
  return res.json();
}

export async function editarTela(id: string, data: object) {
  const res = await fetch(`/api/telas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Erro ao atualizar tela');
  return res.json();
}
