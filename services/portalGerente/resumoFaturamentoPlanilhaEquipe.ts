import { apiFetch } from '@/lib/api/fetchHelper';
import { LinhaResumoFaturamentoProps } from '@/lib/api/dashboardEquipeDomain';

export interface ResumoFaturamentoPlanilhaEquipeResponse {
  data: LinhaResumoFaturamentoProps[];
}

interface GetResumoFaturamentoPlanilhaEquipeParams {
  mes?: number;
  ano?: number;
}

export async function getResumoFaturamentoPlanilhaEquipe(
  params: GetResumoFaturamentoPlanilhaEquipeParams = {}
) {
  const query = new URLSearchParams();
  if (params.mes) query.set('mes', String(params.mes));
  if (params.ano) query.set('ano', String(params.ano));
  return apiFetch<ResumoFaturamentoPlanilhaEquipeResponse>(
    `/api/notas-equipe/resumo?${query}`,
    'Erro ao buscar resumo de faturamento da equipe'
  );
}
