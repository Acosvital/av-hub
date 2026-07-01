export interface ProdutoCadastroProps {
  id: string;
  codigo_produto: string;
  id_produto_omie: string | null;
  descricao: string;
  familias_produtos: string;
  unidade_medida: string | null;
  ncm: string | null;
  especificacoes: Record<string, unknown>;
  ativo: boolean;
  id_origem: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface FormProdutoCadastro {
  codigo_produto: string;
  id_produto_omie: string;
  descricao: string;
  familias_produtos: string;
  unidade_medida: string;
  ncm: string;
  especificacoes: string;
  ativo: boolean;
}
