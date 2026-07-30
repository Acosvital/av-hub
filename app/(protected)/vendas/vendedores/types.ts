export interface VendedorCadastroProps {
  id: string;
  codigo_vendedor_omie: string;
  nome: string;
  comissao: boolean;
  email: string | null;
  ajuda_custo: number | null;
  filial: string | null;
  codigo_empresa: string;
  ativo: boolean;
  id_origem: string | null;
  id_usuario: string | null;
  id_funcionario: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface FormVendedorCadastro {
  codigo_vendedor_omie: string;
  nome: string;
  comissao: boolean;
  email: string;
  ajuda_custo: string;
  filial: string;
  ativo: boolean;
  id_usuario: string;
}
