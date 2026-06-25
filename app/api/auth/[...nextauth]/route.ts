import NextAuth, { AuthOptions } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { MenuItem, UserSession } from '@/components/Layout/AppLayout/Menu/MenuItem/MenuItem';

async function findUserByEmail(email: string): Promise<string | null> {
  try {
    const res = await fetch(`${process.env.API_URL}/autenticacao/azure`, {
      method: 'POST',
      headers: {
        'x-api-key': process.env.API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.id ?? null;
  } catch {
    return null;
  }
}

async function fetchMenu(id_usuario: string): Promise<UserSession | null> {
  try {
    const res = await fetch(`${process.env.API_URL}/permissoes_usuario/menu/${id_usuario}`, {
      headers: { 'x-api-key': process.env.API_KEY || '' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export const authOptions: AuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID || '',
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET || '',
      tenantId: process.env.AZURE_AD_TENANT_ID || '',
      authorization: {
        params: {
          prompt: 'select_account', //Parâmetro para seleção de multiplas contas;
        },
      },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const res = await fetch(`${process.env.API_URL}/autenticacao/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': process.env.API_KEY || '',
            },
            body: JSON.stringify({
              email: credentials.email,
              senha: credentials.password,
            }),
          });

          if (!res.ok) return null;

          const data = await res.json();
          return { email: credentials.email, ...data };
        } catch {
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, account, user }) {
      if (account?.provider === 'azure-ad') {
        token.authProvider = 'azure';
        const id_usuario = await findUserByEmail(token.email ?? '');
        if (id_usuario) {
          const userSession = await fetchMenu(id_usuario);
          token.id_usuario = id_usuario;
          token.name = userSession?.usuario.username ?? token.name;
          token.picture = userSession?.usuario.avatar_url ?? token.picture;
          token.menu = userSession?.menu ?? [];
        }
      }

      if (account?.provider === 'credentials' && user) {
        token.authProvider = 'credentials';
        token.id_usuario = user.id;
        const userSession = await fetchMenu(user.id);
        token.email = userSession?.usuario.email ?? token.email;
        token.name = userSession?.usuario.username ?? token.name ?? token.email;
        token.picture = userSession?.usuario.avatar_url ?? token.picture;
        token.menu = userSession?.menu ?? [];
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id_usuario = token.id_usuario as string;
        session.user.authProvider = token.authProvider as 'azure' | 'credentials';
        session.user.menu = (token.menu ?? []) as MenuItem[];
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
    signOut: '/',
    error: '/login',
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
