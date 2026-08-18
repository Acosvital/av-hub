import categoriasData from '@/app/(protected)/orcamento/_data/categorias.json';

interface CategoriasResponse {
  categorias: string[];
}

const categorias = categoriasData as string[];

// Dados mockados — sem requisição real até existir uma API própria do módulo de compras.
export async function getCategorias(): Promise<CategoriasResponse> {
  return { categorias };
}
