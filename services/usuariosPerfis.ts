interface GetUsuariosPerfisParams {
  page?: number;
  limit?: number;
  id_usuario?: string;
  id_perfil?: string;
}

export async function getUsuariosPerfis(params: GetUsuariosPerfisParams = {}) {
  const query = new URLSearchParams();

  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.id_usuario) query.set('id_usuario', params.id_usuario);
  if (params.id_perfil) query.set('id_perfil', params.id_perfil);

  const res = await fetch(`/api/usuarios-perfis?${query}`);
  if (!res.ok) throw new Error('Erro ao buscar vínculos de usuário e perfil');
  return res.json();
}

export async function criarUsuarioPerfil(data: object) {
  const res = await fetch('/api/usuarios-perfis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Erro ao criar vínculo');
  return res.json();
}

export async function deletarUsuarioPerfil(id: string) {
  const res = await fetch(`/api/usuarios-perfis/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Erro ao remover vínculo');
  return res.json();
}
