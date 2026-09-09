import { apiFetch } from '@/lib/api/fetchHelper';
import { ClienteInativoEmpresaProps } from '@/lib/api/dashboardEquipeDomain';

interface GetClientesInativosEquipeParams {
  diasSemComprar?: number;
}

interface ClientesInativosEquipeResponse {
  data: ClienteInativoEmpresaProps[];
}

export async function getClientesInativosEquipe(params: GetClientesInativosEquipeParams = {}) {
  const query = new URLSearchParams();
  if (params.diasSemComprar) query.set('dias_sem_comprar', String(params.diasSemComprar));
  return apiFetch<ClientesInativosEquipeResponse>(
    `/api/equipe-clientes-inativos?${query}`,
    'Erro ao buscar clientes inativos da equipe'
  );
}
