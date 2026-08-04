import { SetoresProps } from '@/app/(protected)/rh/solicitacoes-de-vagas/types';
import { apiFetch } from '@/lib/api/fetchHelper';
import { PaginatedResponse } from './types';

export interface GetUnidadesParams {
  page?: number;
  limit?: number;
  tipo_unidade?: string;
}

export interface UnidadeProps {
  id: string;
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  tipo_unidade: string;
  matriz_id?: string;
  nome_contato: string;
  email: string;
  telefone: string;
  celular?: null;
  homepage?: null;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  latitude_y: string;
  longitude_x: string;
  id_origem?: null;
  created_at: string;
  updated_at: string;
}

export interface UnidadesResponse extends PaginatedResponse {
  unidades: UnidadeProps[];
}

/******* SETORES *******/
interface GetSetoresParams {
  page?: number;
  limit?: number;
  ativo?: boolean;
}
interface SetoresResponse extends PaginatedResponse {
  setores: SetoresProps[];
}

export async function getSetores(params: GetSetoresParams = {}): Promise<SetoresResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.ativo !== undefined) query.set('ativo', String(params.ativo));
  return apiFetch(`/api/referenciais/setores?${query}`, 'Erro ao buscar setores');
}

export async function getUnidades(params: GetUnidadesParams = {}): Promise<UnidadesResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.tipo_unidade) query.set('tipo_unidade', params.tipo_unidade);
  return apiFetch(`/api/referenciais/unidades?${query}`, 'Erro ao buscar unidades');
}
