export {};

export interface PermissaoToken {
  id_tela: string;
  tela_nome: string;
  pode_visualizar: boolean;
  pode_criar: boolean;
  pode_editar: boolean;
  pode_deletar: boolean;
}

declare module 'next-auth' {
  interface Session {
    user: {
      id_usuario: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      perfis: string[];
      permissoes: PermissaoToken[];
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id_usuario?: string;
    perfis?: string[];
    permissoes?: PermissaoToken[];
  }
}
