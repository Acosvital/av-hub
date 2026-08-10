import { apiFetch } from '@/lib/api/fetchHelper';
import { UsuarioProps } from '@/app/(protected)/cadastros/acessos/usuarios/types';
import { PaginatedResponse } from '../../types';

interface GetUsuariosParams {
  page?: number;
  limit?: number;
  username?: string;
  email?: string;
  ativo?: boolean;
}

interface UsuariosResponse extends PaginatedResponse {
  usuarios: UsuarioProps[];
}

export async function getUsuarios(params: GetUsuariosParams = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.username) query.set('username', params.username);
  if (params.email) query.set('email', params.email);
  if (params.ativo !== undefined) query.set('ativo', String(params.ativo));
  return apiFetch<UsuariosResponse>(`/api/usuarios?${query}`, 'Erro ao buscar usuários');
}

export async function criarUsuario(data: object) {
  return apiFetch('/api/usuarios', 'Erro ao criar usuário', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function editarUsuario(id: string, data: object) {
  return apiFetch(`/api/usuarios/${id}`, 'Erro ao atualizar usuário', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function alterarSenha(id: string, data: { senha_atual: string; senha_nova: string }) {
  return apiFetch(`/api/usuarios/${id}`, 'Erro ao alterar senha', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deletarUsuario(id: string) {
  const res = await fetch(`/api/usuarios/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const body = await res.text().catch(() => '(sem corpo)');
    console.error(`Erro ao deletar usuário — status ${res.status}: ${body}`);
    throw new Error(`Erro ao deletar usuário (status ${res.status})`);
  }
}
