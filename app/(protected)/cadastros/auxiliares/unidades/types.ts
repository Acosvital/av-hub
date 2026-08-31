export const TIPOS_UNIDADE = [
  { value: 'matriz', label: 'Matriz' },
  { value: 'filial', label: 'Filial' },
] as const;

export interface UnidadeProps {
  id: string;
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  tipo_unidade: string;
  matriz_id: string | null;
  nome_contato: string;
  email: string;
  telefone: string;
  celular: string | null;
  homepage: string | null;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  latitude_y: string | null;
  longitude_x: string | null;
  ordem_exibicao: number | null;
  id_origem?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface FormUnidade {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  tipo_unidade: string;
  matriz_id: string;
  nome_contato: string;
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
  ordem_exibicao: string;
}
