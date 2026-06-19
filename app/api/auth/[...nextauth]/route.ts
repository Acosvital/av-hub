import NextAuth, { AuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: AuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID || "",
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET || "",
      tenantId: process.env.AZURE_AD_TENANT_ID || "",
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const res = await fetch(`${process.env.API_URL}/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": process.env.API_KEY || "",
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!res.ok) return null;

          // Esperado do backend: { id, email, name, role, userType }
          return await res.json();
        } catch {
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, user }) {
      if (account?.provider === "azure-ad") {
        token.authProvider = "azure";
        token.role = "funcionario";

        if (token.email === "robert.stoco@acosvital.com.br") {
          token.role = "admin";
        }

        // Busca id_usuario no banco pelo e-mail do Azure
        try {
          const res = await fetch(
            `${process.env.API_URL}/usuarios?email=${encodeURIComponent(token.email ?? "")}`,
            { headers: { "x-api-key": process.env.API_KEY || "" } }
          );
          if (res.ok) {
            const data = await res.json();
            const usuario = Array.isArray(data) ? data[0] : data?.data?.[0];
            if (usuario?.id) token.id_usuario = usuario.id;
          }
        } catch {
          // id_usuario fica undefined; menu retornará vazio
        }
      }

      if (account?.provider === "credentials" && user) {
        token.authProvider = "credentials";
        token.id_usuario = (user as any).id;
        token.role = (user as any).role;
        token.userType = (user as any).userType;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id_usuario = token.id_usuario as string;
        session.user.role = (token.role ?? "") as string;
        session.user.authProvider = token.authProvider as "azure" | "credentials";
        session.user.permissoes = token.permissoes ?? [];
        session.user.perfis = token.perfis ?? [];
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
    signOut: "/",
    error: "/login",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
