export type TipoVaga = 'CLT' | 'PJ' | 'Estágio' | 'Temporário' | 'Terceirizado';

export const TIPOS_VAGA: TipoVaga[] = ['CLT', 'PJ', 'Estágio', 'Temporário', 'Terceirizado'];

export type SituacaoVaga = 'pendente' | 'aprovado' | 'reprovado';

export const SITUACOES_VAGA: SituacaoVaga[] = ['pendente', 'aprovado', 'reprovado'];

export const SITUACAO_LABEL: Record<SituacaoVaga, string> = {
  pendente: 'Pendente',
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
};

//Dados que virão da requisição
export interface SolicitacaoVagaProps {
  id: string;
  data_solicitacao: string;
  solicitante: string;
  id_setor: string;
  cargo_vaga: string;
  observacao_motivo: string | null;
  quantidade: number;
  tipo_vaga: TipoVaga | null;
  salario: number | null;
  observacao: string | null;
  insalubridade: number | null;
  vr: number | null;
  custo_total: number | null;
  situacao: SituacaoVaga;
  created_at: string;
  updated_at: string;
}

//Dados que serão utilizados no insert/update
export interface FormSolicitacaoVaga {
  data_solicitacao: string;
  solicitante: string;
  id_setor: string;
  cargo_vaga: string;
  observacao_motivo: string;
  quantidade: number;
  tipo_vaga: TipoVaga;
  salario: number;
  observacao: string;
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
