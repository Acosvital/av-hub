import { apiFetch } from '@/lib/api/fetchHelper';

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
  return apiFetch(`/api/telas?${query}`, 'Erro ao buscar telas');
}

export async function criarTela(data: object) {
  return apiFetch('/api/telas', 'Erro ao criar tela', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function editarTela(id: string, data: object) {
  return apiFetch(`/api/telas/${id}`, 'Erro ao atualizar tela', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}
