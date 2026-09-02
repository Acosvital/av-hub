import { apiFetch } from '@/lib/api/fetchHelper';
import { MetaMensalProps } from '@/app/(protected)/cadastros/auxiliares/metas-mensais/types';
import { PaginatedResponse } from '../../types';

interface GetMetasMensaisParams {
  page?: number;
  limit?: number;
  ano?: number;
  mes?: number;
  tipo?: 'venda' | 'faturamento';
}

interface MetasMensaisResponse extends PaginatedResponse {
  metas_mensais: MetaMensalProps[];
}

export async function getMetasMensais(params: GetMetasMensaisParams = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.ano) query.set('ano', String(params.ano));
  if (params.mes) query.set('mes', String(params.mes));
  if (params.tipo) query.set('tipo', params.tipo);
  return apiFetch<MetasMensaisResponse>(`/api/metas-mensais?${query}`, 'Erro ao buscar metas mensais');
}

export async function salvarMeta(data: { mes: number; ano: number; meta: number; tipo: string }) {
  return apiFetch('/api/metas-mensais', 'Erro ao salvar meta', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deletarMeta(ano: number, mes: number, tipo: string) {
  const res = await fetch(`/api/metas-mensais/${ano}/${mes}/${tipo}`, { method: 'DELETE' });
  if (!res.ok) {
    const body = await res.text().catch(() => '(sem corpo)');
    console.error(`Erro ao deletar meta — status ${res.status}: ${body}`);
    throw new Error(`Erro ao deletar meta (status ${res.status})`);
  }
}
