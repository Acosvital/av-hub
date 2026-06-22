import { apiFetch } from '@/lib/api/fetchHelper';

export async function getTodosFornecedores(nome: string = '') {
  return apiFetch(
    `/api/parceiros/todosFornecedores?nome_fantasia=${nome}`,
    'Erro ao buscar todos os fornecedores'
  );
}
