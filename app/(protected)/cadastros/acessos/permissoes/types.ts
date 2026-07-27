export interface PermissaoProps {
  id: string;
  id_perfil: string;
  id_tela: string;
  perfil_nome?: string;
  tela_nome?: string;
  pode_visualizar: boolean;
  pode_criar: boolean;
  pode_editar: boolean;
  pode_deletar: boolean;
  created_by: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface FormPermissao {
  id_perfil: string;
  id_tela: string;
  pode_visualizar: boolean;
  pode_criar: boolean;
  pode_editar: boolean;
  pode_deletar: boolean;
}
