interface GetUsuariosParams {
  page?: number;
  limit?: number;
  username?: string;
  email?: string;
  ativo?: boolean;
}

export async function getUsuarios(params: GetUsuariosParams = {}) {
  const query = new URLSearchParams();

  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.username) query.set('username', params.username);
  if (params.email) query.set('email', params.email);
  if (params.ativo !== undefined) query.set('ativo', String(params.ativo));

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
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Erro ao atualizar usuário');
  return res.json();
}

export async function deletarUsuario(id: string) {
  const res = await fetch(`/api/usuarios/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erro ao deletar usuário');
}
