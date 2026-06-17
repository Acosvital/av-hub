export interface UsuarioPerfilProps {
  id: string;
  id_usuario: string;
  id_perfil: string;
  usuario_nome?: string;
  perfil_nome?: string;
  created_by: string | null;
  created_at?: string;
}

export interface FormUsuarioPerfil {
  id_usuario: string;
  id_perfil: string;
}
