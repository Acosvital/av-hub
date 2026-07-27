export type TipoVaga = 'CLT' | 'PJ' | 'Estágio' | 'Temporário' | 'Terceirizado';

export type SituacaoVaga = 'Pendente' | 'Em Análise' | 'Aprovada' | 'Reprovada' | 'Cancelada';

export const TIPOS_VAGA: TipoVaga[] = ['CLT', 'PJ', 'Estágio', 'Temporário', 'Terceirizado'];

export const SITUACOES_VAGA: SituacaoVaga[] = [
  'Pendente',
  'Em Análise',
  'Aprovada',
  'Reprovada',
  'Cancelada',
];

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

//Dados que serão utilizados no insert/update — a Data da Solicitação não entra aqui:
//é atribuída automaticamente no cadastro e preservada na edição, como um campo de auditoria.
export interface FormSolicitacaoVaga {
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
