export type TipoVaga = 'CLT' | 'PJ' | 'Estágio' | 'Temporário' | 'Terceirizado';

export type SituacaoVaga = 'Pendente' | 'Aprovada' | 'Reprovada' | 'Cancelada';

export const TIPOS_VAGA: TipoVaga[] = ['CLT', 'PJ', 'Estágio', 'Temporário', 'Terceirizado'];

export const SITUACOES_VAGA: SituacaoVaga[] = ['Pendente', 'Aprovada', 'Reprovada', 'Cancelada'];

//Dados que virão da requisição
export interface SolicitacaoVagaProps {
  id: string;
  data_solicitacao: string;
  solicitante: string;
  setor: string;
  cargo: string;
  observacao_motivo: string;
  quantidade: number;
  tipo_vaga: TipoVaga;
  salario: number;
  obs: string;
  insalubridade: number;
  vr: number;
  situacao: SituacaoVaga;
}

//Dados que serão utilizados no insert/update
export interface FormSolicitacaoVaga {
  data_solicitacao: string;
  solicitante: string;
  setor: string;
  cargo: string;
  observacao_motivo: string;
  quantidade: number;
  tipo_vaga: TipoVaga;
  salario: number;
  obs: string;
  insalubridade: number;
  vr: number;
  situacao: SituacaoVaga;
}

export interface SetoresProps {
  id: string;
  codigo_setor: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  parent_id: string;
  nivel: number;
  sigla: string;
  cor_setor: string;
  id_origem: string | null;
  created_at: string;
  updated_at: string;
}
