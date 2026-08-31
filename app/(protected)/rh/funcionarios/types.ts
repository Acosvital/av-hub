export interface FuncionarioProps {
  id: string;
  nome_completo: string;
  id_cargo: string;
  id_setor: string;
  codigo_empresa: string;
  photo_url: string | null;
  cpf: string | null;
  rg: string | null;
  cnpj: string | null;
  contrato_tipo: string | null;
  jornada_trabalho: string | null;
  data_nascimento: string | null;
  data_admissao: string | null;
  data_desligamento: string | null;
  telefone: string | null;
  celular: string | null;
  homepage: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface FormFuncionario {
  nome_completo: string;
  id_cargo: string;
  id_setor: string;
  codigo_empresa: string;
  // Campo só de UI — não existe em /funcionarios. Vira o parent_id do nó
  // desse funcionário no organograma (core_organograma.node); vazio =
  // hierarquia automática pelo setor (ver services/rh/organogramaNodes.ts).
  reporta_a_id: string;
  photo_url: string;
  cpf: string;
  rg: string;
  cnpj: string;
  contrato_tipo: string;
  jornada_trabalho: string;
  data_nascimento: string;
  data_admissao: string;
  data_desligamento: string;
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
}
