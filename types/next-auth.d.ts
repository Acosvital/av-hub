import type { MenuItem } from '@/components/Layout/AppLayout/Menu/MenuItem/MenuItem';

declare module 'next-auth' {
  interface Session {
    user: {
      id_usuario: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      authProvider: 'azure' | 'credentials';
      menu: MenuItem[];
      perfis: string[];
      // Id da tela configurada como inicial no cadastro de Perfis (campo
      // tela_inicial_id, ainda não implementado no backend) — null enquanto
      // não existir ou não estiver configurada pro(s) perfil(is) do usuário.
      telaInicialId: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id_usuario?: string;
    authProvider?: 'azure' | 'credentials';
    menu?: MenuItem[];
    perfis?: string[];
    telaInicialId?: string | null;
  }
}
