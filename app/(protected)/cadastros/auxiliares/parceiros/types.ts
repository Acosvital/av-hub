export interface ParceiroProps {
  id: string;
  codigo_parceiro_omie: string;
  nome_fantasia: string;
  razao_social: string;
  cpf_cnpj: string;
  observacao: string | null;
  email: string | null;
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
  id_origem: string | null;
  latitude_y: string | null;
  longitude_x: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface FormParceiro {
  codigo_parceiro_omie: string;
  nome_fantasia: string;
  razao_social: string;
  cpf_cnpj: string;
  observacao: string;
  email: string;
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
  latitude_y: string;
  longitude_x: string;
}
