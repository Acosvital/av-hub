import { apiFetch } from '@/lib/api/fetchHelper';
import { FechamentoManualProps, TipoFechamento } from '@/app/(protected)/fechamento/types';
import { PaginatedResponse } from '../types';

interface GetFechamentoManualParams {
  ano?: number;
  mes?: number;
  tipo?: TipoFechamento;
  limit?: number;
}

interface FechamentoManualResponse extends PaginatedResponse {
  fechamento_manual: FechamentoManualProps[];
}

export async function getFechamentoManual(params: GetFechamentoManualParams = {}) {
  const query = new URLSearchParams();
  if (params.ano) query.set('ano', String(params.ano));
  if (params.mes) query.set('mes', String(params.mes));
  if (params.tipo) query.set('tipo', params.tipo);
  query.set('limit', String(params.limit ?? 100));
  return apiFetch<FechamentoManualResponse>(
    `/api/fechamento-manual?${query}`,
    'Erro ao buscar fechamento manual'
  );
}

export async function salvarFechamentoManual(data: {
  mes: number;
  ano: number;
  tipo: TipoFechamento;
  valor_total: number;
}) {
  return apiFetch('/api/fechamento-manual', 'Erro ao salvar fechamento', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deletarFechamentoManual(ano: number, mes: number, tipo: TipoFechamento) {
  return apiFetch(`/api/fechamento-manual/${ano}/${mes}/${tipo}`, 'Erro ao remover fechamento', {
    method: 'DELETE',
  });
}
