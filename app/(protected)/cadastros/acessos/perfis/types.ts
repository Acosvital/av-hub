//Dados que virão da requisição
export interface PerfilProps {
  id: string;
  nome: string;
  descricao?: string | null;
  // Tela pra onde o usuário com esse perfil é redirecionado ao logar (ver
  // app/(protected)/page.tsx). Ainda não implementado no backend — até lá,
  // fica sempre undefined/null e o app usa um fallback por nome de perfil.
  tela_inicial_id?: string | null;
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
  tela_inicial_id?: string | null;
}
