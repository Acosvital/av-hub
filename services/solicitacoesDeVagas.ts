import solicitacoesData from '@/app/(protected)/rh/_data/solicitacoesDeVagas.json';
import {
  FormSolicitacaoVaga,
  SolicitacaoVagaProps,
} from '@/app/(protected)/rh/solicitacoes-de-vagas/types';

interface SolicitacoesDeVagasResponse {
  solicitacoes: SolicitacaoVagaProps[];
  total: number;
}

let solicitacoes = solicitacoesData as SolicitacaoVagaProps[];

// Dados mockados — sem requisição real até existir uma API própria do módulo de RH.
export async function getSolicitacoesDeVagas(): Promise<SolicitacoesDeVagasResponse> {
  return { solicitacoes, total: solicitacoes.length };
}

export async function criarSolicitacaoVaga(
  data: FormSolicitacaoVaga
): Promise<SolicitacaoVagaProps> {
  const nova: SolicitacaoVagaProps = { ...data, id: crypto.randomUUID() };
  solicitacoes = [nova, ...solicitacoes];
  return nova;
}

export async function editarSolicitacaoVaga(
  id: string,
  data: FormSolicitacaoVaga
): Promise<SolicitacaoVagaProps> {
  const atualizada: SolicitacaoVagaProps = { ...data, id };
  solicitacoes = solicitacoes.map((s) => (s.id === id ? atualizada : s));
  return atualizada;
}

export async function deletarSolicitacaoVaga(id: string): Promise<void> {
  solicitacoes = solicitacoes.filter((s) => s.id !== id);
}
