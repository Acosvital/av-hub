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

interface VinculoPerfilBackend {
  id_perfil: string;
  perfil_nome?: string;
}

interface PerfilBackend {
  id: string;
  nome: string;
  // Tela inicial configurada pelo admin no cadastro de Perfis (id de uma
  // tela, ex: 'meu-dashboard') — ainda não existe no backend. Enquanto não
  // existir, vem undefined e o app cai no fallback por nome de perfil (ver
  // app/(protected)/page.tsx). Contrato pra quando for implementado:
  // `perfis.tela_inicial_id: string | null`, FK pra `telas.id`.
  tela_inicial_id?: string | null;
}

export interface InfoPerfisDoUsuario {
  nomes: string[];
  telaInicialId: string | null;
}

// Perfis vinculados ao usuário — usado só pra decidir a tela inicial por
// perfil (ver app/(protected)/page.tsx). Busca direto no backend (com a API
// key server-to-server), não pelas rotas /api/usuariosPerfis e /api/perfis
// do próprio Hub: essas exigem permissão de tela de cadastro
// ('usuarios-perfis'/'perfis'), que a maioria dos perfis (ex: Vendedor) não
// tem — usá-las aqui faria todo login estourar 403 só pra descobrir o perfil.
async function fetchInfoPerfisDoUsuario(id_usuario: string): Promise<InfoPerfisDoUsuario> {
  const vazio: InfoPerfisDoUsuario = { nomes: [], telaInicialId: null };
  try {
    const vinculosRes = await fetch(
      `${process.env.API_URL}/usuarios_perfis?id_usuario=${id_usuario}&limit=50`,
      { headers: { 'x-api-key': process.env.API_KEY || '' } }
    );
    if (!vinculosRes.ok) return vazio;
    const vinculos = await vinculosRes.json();
    const lista: VinculoPerfilBackend[] = vinculos?.data ?? [];
    if (!lista.length) return vazio;

    // Precisa do cadastro completo de perfis de qualquer forma (o vínculo
    // não carrega tela_inicial_id, só perfil_nome opcionalmente).
    const perfisRes = await fetch(`${process.env.API_URL}/perfis?limit=1000`, {
      headers: { 'x-api-key': process.env.API_KEY || '' },
    });
    const perfisById = new Map<string, PerfilBackend>();
    if (perfisRes.ok) {
      const perfis = await perfisRes.json();
      (perfis?.perfis ?? []).forEach((p: PerfilBackend) => perfisById.set(p.id, p));
    }

    const nomes = lista
      .map((v) => v.perfil_nome ?? perfisById.get(v.id_perfil)?.nome)
      .filter((nome): nome is string => Boolean(nome));

    // Primeiro vínculo (na ordem em que o backend devolve) cujo perfil tem
    // tela_inicial_id configurada. Sem regra de prioridade explícita ainda —
    // se isso virar um problema real (usuário com 2 perfis conflitantes),
    // a resposta certa é o backend expor uma ordem/prioridade, não inventar
    // uma regra aqui.
    const telaInicialId =
      lista
        .map((v) => perfisById.get(v.id_perfil)?.tela_inicial_id)
        .find((id): id is string => Boolean(id)) ?? null;

    return { nomes, telaInicialId };
  } catch {
    return vazio;
  }
}

export const authOptions: AuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID || '',
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET || '',
      tenantId: process.env.AZURE_AD_TENANT_ID || '',
      // authorization: {
      //   params: {
      //     prompt: 'select_account', //Parâmetro para seleção de multiplas contas;
      //   },
      // },
      // Sem "prompt" fixo: o Azure AD decide o fluxo, permitindo login silencioso
      // via Seamless SSO quando a sessão do Windows/Kerberos já está autenticada.
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
    async jwt({ token, account, user, trigger }) {
      if (account?.provider === 'azure-ad') {
        token.authProvider = 'azure';
        const id_usuario = await findUserByEmail(token.email ?? '');
        if (id_usuario) {
          const [userSession, infoPerfis] = await Promise.all([
            fetchMenu(id_usuario),
            fetchInfoPerfisDoUsuario(id_usuario),
          ]);
          token.id_usuario = id_usuario;
          token.name = userSession?.usuario.username ?? token.name;
          token.picture = userSession?.usuario.avatar_url ?? token.picture;
          token.menu = userSession?.menu ?? [];
          token.perfis = infoPerfis.nomes;
          token.telaInicialId = infoPerfis.telaInicialId;
        }
      }

      if (account?.provider === 'credentials' && user) {
        token.authProvider = 'credentials';
        token.id_usuario = user.id;
        const [userSession, infoPerfis] = await Promise.all([
          fetchMenu(user.id),
          fetchInfoPerfisDoUsuario(user.id),
        ]);
        token.email = userSession?.usuario.email ?? token.email;
        token.name = userSession?.usuario.username ?? token.name ?? token.email;
        token.picture = userSession?.usuario.avatar_url ?? token.picture;
        token.menu = userSession?.menu ?? [];
        token.perfis = infoPerfis.nomes;
        token.telaInicialId = infoPerfis.telaInicialId;
      }

      // Disparado pelo client via `useSession().update()` — recarrega o menu
      // (telas/permissões) sem exigir logout/login. Sem isso, uma permissão
      // nova concedida a um usuário só aparecia pra ele na próxima sessão.
      if (trigger === 'update' && token.id_usuario) {
        const [userSession, infoPerfis] = await Promise.all([
          fetchMenu(token.id_usuario as string),
          fetchInfoPerfisDoUsuario(token.id_usuario as string),
        ]);
        if (userSession) token.menu = userSession.menu ?? token.menu;
        token.perfis = infoPerfis.nomes;
        token.telaInicialId = infoPerfis.telaInicialId;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id_usuario = token.id_usuario as string;
        session.user.authProvider = token.authProvider as 'azure' | 'credentials';
        session.user.menu = (token.menu ?? []) as MenuItem[];
        session.user.perfis = (token.perfis ?? []) as string[];
        session.user.telaInicialId = (token.telaInicialId ?? null) as string | null;
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
