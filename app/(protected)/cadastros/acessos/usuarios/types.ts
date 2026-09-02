export interface UsuarioProps {
  id: string;
  username: string;
  email: string;
  id_funcionario: string | null;
  ativo: boolean;
  setor_irrestrito: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FormUsuario {
  username: string;
  email: string;
  senha: string;
  id_funcionario: string;
  ativo: boolean;
  setor_irrestrito: boolean;
}
