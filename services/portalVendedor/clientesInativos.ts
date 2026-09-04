import { apiFetch } from '@/lib/api/fetchHelper';
import { ClienteInativoProps } from '@/app/(protected)/meu-dashboard/types';

interface GetClientesInativosParams {
  diasSemComprar?: number;
}

interface ClientesInativosResponse {
  vinculado: boolean;
  data: ClienteInativoProps[];
}

export async function getClientesInativos(params: GetClientesInativosParams = {}) {
  const query = new URLSearchParams();
  if (params.diasSemComprar) query.set('dias_sem_comprar', String(params.diasSemComprar));
  return apiFetch<ClientesInativosResponse>(
    `/api/meus-clientes-inativos?${query}`,
    'Erro ao buscar clientes inativos'
  );
}
