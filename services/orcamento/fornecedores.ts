import { FornecedorProps } from '@/app/(protected)/orcamento/historico-produtos/types';
import fornecedoresData from '@/app/(protected)/orcamento/_data/fornecedores.json';
import normalizeText from '@/utils/normalizeText';

interface FornecedoresResponse {
  fornecedores: FornecedorProps[];
}

// Dados mockados — sem requisição real até existir uma API própria do módulo de compras.
export async function getFornecedores(nome: string = ''): Promise<FornecedoresResponse> {
  const termo = normalizeText(nome);
  const fornecedores = fornecedoresData
    .filter((f) => !termo || normalizeText(f.nome_fantasia).includes(termo))
    .slice(0, 20)
    .map((f) => ({
      codigo_parceiro_omie: f.codigo_parceiro_omie,
      email: f.email,
      estado: f.estado,
      nome_fantasia: f.nome_fantasia,
      telefone: f.telefone,
    }));
  return { fornecedores };
}
