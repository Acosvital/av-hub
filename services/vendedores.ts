import { apiFetch } from '@/lib/api/fetchHelper';

export interface VendedorProps {
  codigo_vendedor: string;
  nome: string;
}

interface VendedoresResponse {
  vendedores: VendedorProps[];
}

export async function getVendedores() {
  return apiFetch<VendedoresResponse>('/api/referenciais/vendedores', 'Erro ao buscar vendedores');
}
