import { apiFetch } from '@/lib/api/fetchHelper';

export interface UnidadeFiltroProps {
  id: string;
  nome_fantasia: string;
}

// Fonte do seletor "Empresa" no cabeçalho dos dashboards (OverlayHeader) —
// contrapartida enxuta de getUnidades (services/cadastros/auxiliares/unidades.ts),
// que exige permissão da tela de cadastro e por isso não serve aqui (ver
// app/api/dashboard/unidades/route.ts).
export async function getUnidadesFiltro() {
  return apiFetch<{ unidades: UnidadeFiltroProps[] }>(
    '/api/dashboard/unidades',
    'Erro ao buscar unidades'
  );
}
