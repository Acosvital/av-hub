import { apiFetch } from '@/lib/api/fetchHelper';

export async function getFornecedores(nome: string = '') {
  return apiFetch(`/api/parceiros/fornecedores?search=${nome}`, 'Erro ao buscar fornecedores');
}
