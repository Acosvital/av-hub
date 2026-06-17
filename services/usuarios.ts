interface GetUsuariosParams {
  page?: number;
  limit?: number;
  nome?: string;
  email?: string;
  ativo?: boolean;
  id_cargo?: string;
  id_setor?: string;
  id_unidade?: string;
}

export async function getUsuarios(params: GetUsuariosParams = {}) {
  const query = new URLSearchParams();

  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.nome) query.set('nome', params.nome);
  if (params.email) query.set('email', params.email);
  if (params.ativo !== undefined) query.set('ativo', String(params.ativo));
  if (params.id_cargo) query.set('id_cargo', params.id_cargo);
  if (params.id_setor) query.set('id_setor', params.id_setor);
  if (params.id_unidade) query.set('id_unidade', params.id_unidade);

  const res = await fetch(`/api/usuarios?${query}`);
  if (!res.ok) throw new Error('Erro ao buscar usuários');
  return res.json();
}

export async function criarUsuario(data: object) {
  const res = await fetch('/api/usuarios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Erro ao criar usuário');
  return res.json();
}

export async function editarUsuario(id: string, data: object) {
  const res = await fetch(`/api/usuarios/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Erro ao atualizar usuário');
  return res.json();
}
