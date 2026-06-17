import NextAuth from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { PermissaoToken } from '@/types/next-auth';

async function buscarUsuarioComPermissoes(email: string): Promise<{
  id: string;
  perfis: string[];
  permissoes: PermissaoToken[];
} | null> {
  const res = await fetch(
    `${process.env.API_URL}/usuarios?email=${encodeURIComponent(email)}&limit=1`,
    { headers: { 'x-api-key': process.env.API_KEY! }, cache: 'no-store' }
  );

  if (!res.ok) return null;

  const data = await res.json();
  const usuario = data.usuarios?.[0];

  if (!usuario) return null;

  return {
    id: usuario.id,
    perfis: usuario.perfis ?? [],
    permissoes: usuario.permissoes ?? [],
  };
}

const handler = NextAuth({
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID || '',
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET || '',
      tenantId: process.env.AZURE_AD_TENANT_ID || '',
      authorization: {
        params: {
          prompt: 'select_account',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // account só existe no login inicial — evita chamada ao DB em cada refresh de token
      if (account) {
        const usuario = await buscarUsuarioComPermissoes(token.email!);

        if (!usuario) {
          // email não cadastrado no sistema — bloqueia o login
          throw new Error('Usuário não encontrado');
        }

        token.id_usuario = usuario.id;
        token.perfis = usuario.perfis;
        token.permissoes = usuario.permissoes;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id_usuario = token.id_usuario ?? '';
        session.user.perfis = token.perfis ?? [];
        session.user.permissoes = token.permissoes ?? [];
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
    signOut: '/',
    error: '/login',
  },
});

export { handler as GET, handler as POST };