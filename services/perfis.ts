import { apiFetch } from '@/lib/api/fetchHelper';

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
  return apiFetch(`/api/perfis?${query}`, 'Erro ao buscar perfis');
}

export async function criarPerfil(data: object) {
  return apiFetch('/api/perfis', 'Erro ao criar perfil', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function editarPerfil(id: string, data: object) {
  return apiFetch(`/api/perfis/${id}`, 'Erro ao atualizar perfil', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}
