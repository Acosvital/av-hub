import { VinculoProps } from '@/app/(protected)/orcamento/vinculos/types';
import vinculosData from '@/app/(protected)/orcamento/_data/vinculos.json';

interface VinculosResponse {
  vinculos: VinculoProps[];
}

const vinculos = vinculosData as VinculoProps[];

// Dados mockados — sem requisição real até existir uma API própria do módulo de compras.
export async function getVinculos(): Promise<VinculosResponse> {
  return { vinculos };
}
