export interface SetorProps {
  id: string;
  codigo_empresa: string;
  codigo_setor: string | null;
  nome: string;
  descricao: string;
  ativo: boolean;
  parent_id: string | null;
  nivel: number;
  sigla: string | null;
  cor_setor: string | null;
  id_origem?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface FormSetor {
  codigo_empresa: string;
  codigo_setor: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  parent_id: string;
  sigla: string;
  cor_setor: string;
}
