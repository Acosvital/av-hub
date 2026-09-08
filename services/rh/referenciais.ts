import { SetoresProps } from '@/app/(protected)/rh/solicitacoes-de-vagas/types';
import { UnidadeProps } from '@/app/(protected)/cadastros/auxiliares/unidades/types';
import { getSetores as getSetoresCanonico } from '@/services/cadastros/auxiliares/setores';
import { getUnidades as getUnidadesCanonico } from '@/services/cadastros/auxiliares/unidades';

export type { UnidadeProps };

export interface GetUnidadesParams {
  page?: number;
  limit?: number;
  tipo_unidade?: string;
}

interface GetSetoresParams {
  page?: number;
  limit?: number;
  ativo?: boolean;
}

export async function getSetores(params: GetSetoresParams = {}): Promise<{ setores: SetoresProps[]; total: number }> {
  const data = await getSetoresCanonico(params);
  return { ...data, setores: data.setores as unknown as SetoresProps[] };
}

export async function getUnidades(params: GetUnidadesParams = {}): Promise<{ unidades: UnidadeProps[]; total: number }> {
  return getUnidadesCanonico(params);
}
