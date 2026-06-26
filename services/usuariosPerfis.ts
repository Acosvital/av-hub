import { apiFetch } from '@/lib/api/fetchHelper';
import type { UsuarioPerfilProps } from '@/app/(protected)/cadastros/acessos/usuariosperfis/types';
import { PaginatedResponse } from './types';

interface GetUsuariosPerfisParams {
  page?: number;
  limit?: number;
  id_usuario?: string;
  id_perfil?: string;
}

interface UsuariosPerfisResponse extends PaginatedResponse {
  data: UsuarioPerfilProps[];
}

export async function getUsuariosPerfis(params: GetUsuariosPerfisParams = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.id_usuario) query.set('id_usuario', params.id_usuario);
  if (params.id_perfil) query.set('id_perfil', params.id_perfil);
  return apiFetch<UsuariosPerfisResponse>(
    `/api/usuariosPerfis?${query}`,
    'Erro ao buscar vínculos de usuário e perfil'
  );
}

export async function criarUsuarioPerfil(data: object) {
  return apiFetch('/api/usuariosPerfis', 'Erro ao criar vínculo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deletarUsuarioPerfil(id_usuario: string, id_perfil: string) {
  return apiFetch(`/api/usuariosPerfis/${id_usuario}/${id_perfil}`, 'Erro ao remover vínculo', {
    method: 'DELETE',
  });
}
