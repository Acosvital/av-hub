export interface UsuarioProps {
  id: string;
  username: string;
  email: string;
  id_funcionario: string | null;
  avatar_url: string | null;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FormUsuario {
  username: string;
  email: string;
  senha: string;
  id_funcionario: string;
  avatar_url: string;
  ativo: boolean;
}
