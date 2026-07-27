//Dados que virão da requisição
export interface TelaProps {
  id: string;
  nome: string;
  slug: string;
  id_parent: string | null;
  ordem: number;
  ativo: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}
//Dados que serão utilizados no insert/update;
export interface FormTela {
  nome: string;
  slug: string;
  id_parent?: string | null;
  ordem: number;
  ativo: boolean;
}
