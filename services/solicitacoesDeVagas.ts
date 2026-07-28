import { apiFetch } from '@/lib/api/fetchHelper';
import { SolicitacaoVagaProps } from '@/app/(protected)/rh/solicitacoes-de-vagas/types';
import { PaginatedResponse } from './types';

interface GetSolicitacoesDeVagasParams {
  page?: number;
  limit?: number;
  solicitante?: string;
  cargo_vaga?: string;
  id_setor?: string;
  situacao?: string;
}

interface SolicitacoesDeVagasResponse extends PaginatedResponse {
  vagas: SolicitacaoVagaProps[];
}

export async function getSolicitacoesDeVagas(params: GetSolicitacoesDeVagasParams = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.solicitante) query.set('solicitante', params.solicitante);
  if (params.cargo_vaga) query.set('cargo_vaga', params.cargo_vaga);
  if (params.id_setor) query.set('id_setor', params.id_setor);
  if (params.situacao) query.set('situacao', params.situacao);
  return apiFetch<SolicitacoesDeVagasResponse>(
    `/api/vagas?${query}`,
    'Erro ao buscar solicitações de vagas'
  );
}

export async function criarSolicitacaoVaga(data: object) {
  return apiFetch('/api/vagas', 'Erro ao criar solicitação de vaga', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function editarSolicitacaoVaga(id: string, data: object) {
  return apiFetch(`/api/vagas/${id}`, 'Erro ao atualizar solicitação de vaga', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deletarSolicitacaoVaga(id: string) {
  const res = await fetch(`/api/vagas/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const body = await res.text().catch(() => '(sem corpo)');
    console.error(`Erro ao deletar solicitação de vaga — status ${res.status}: ${body}`);
    throw new Error(`Erro ao deletar solicitação de vaga (status ${res.status})`);
  }
}
