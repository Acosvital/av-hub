export interface CargoProps {
  id: string;
  nome: string;
}

export interface SetorProps {
  id: string;
  nome: string;
}

export interface UnidadeProps {
  id: string;
  nome_fantasia: string;
}

export type ContratoTipo = 'CLT' | 'PJ' | 'Freelancer';
export type JornadaTrabalho = 'Integral' | 'Meio Período' | 'Flexível';

export interface UsuarioProps {
  id: string;
  nome_completo: string;
  email: string;
  avatar_url?: string | null;
  id_cargo: string;
  cargo_nome?: string;
  id_setor: string;
  setor_nome?: string;
  id_unidade: string;
  unidade_nome?: string;
  telefone?: string | null;
  celular?: string | null;
  homepage?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  cpf?: string | null;
  rg?: string | null;
  ativo: boolean;
  contrato_tipo?: ContratoTipo | null;
  jornada_trabalho?: JornadaTrabalho | null;
  data_nascimento?: string | null;
  data_admissao?: string | null;
  data_desligamento?: string | null;
  nvl_permissao?: number;
  nvl_manual: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FormUsuario {
  nome_completo: string;
  email: string;
  senha: string;
  id_cargo: string;
  id_setor: string;
  id_unidade: string;
  avatar_url: string;
  telefone: string;
  celular: string;
  homepage: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  cpf: string;
  rg: string;
  ativo: boolean;
  contrato_tipo: ContratoTipo | '';
  jornada_trabalho: JornadaTrabalho | '';
  data_nascimento: string;
  data_admissao: string;
  data_desligamento: string;
  nvl_permissao: string;
  nvl_manual: boolean;
}
