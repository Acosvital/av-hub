//Dados que virão da requisição
export interface PerfilProps {
  id: string;
  nome: string;
  descricao?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_by?: string;
  updated_at: string;
  deleted_by?: string | null;
  deleted_at?: string | null;
}

//Dados que serão utilizados no insert/update;
export interface FormPerfil {
  nome: string;
  descricao?: string | null;
}
