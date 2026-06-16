export interface PerfilProps {
  id: string;
  nome: string;
  descricao: string | null;
  created_by: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface FormPerfil {
  nome: string;
  descricao: string;
}
