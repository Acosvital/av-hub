import { apiFetch } from '@/lib/api/fetchHelper';
import {
  ResumoEmpresaProps,
  TopClienteEmpresaProps,
  TopProdutoEmpresaProps,
  ProximoVencimentoEmpresaProps,
} from '@/lib/api/dashboardEquipeDomain';
import { TipoContrato } from '@/lib/api/meuDashboardDomain';

export interface DashboardEquipeResponse {
  mes: number;
  ano: number;
  vendas: ResumoEmpresaProps;
  faturamento: ResumoEmpresaProps;
  classificacaoPedidos: Record<TipoContrato, { quantidade: number; valor: number }>;
  topClientes: TopClienteEmpresaProps[];
  proximosVencimentos: ProximoVencimentoEmpresaProps[];
  topProdutos: TopProdutoEmpresaProps[];
}

interface GetDashboardEquipeParams {
  mes?: number;
  ano?: number;
}

export async function getDashboardEquipe(params: GetDashboardEquipeParams = {}) {
  const query = new URLSearchParams();
  if (params.mes) query.set('mes', String(params.mes));
  if (params.ano) query.set('ano', String(params.ano));
  return apiFetch<DashboardEquipeResponse>(
    `/api/dashboard-equipe?${query}`,
    'Erro ao buscar dashboard da equipe'
  );
}
