import NextAuth from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";

const handler = NextAuth({
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
  ],
  callbacks: {
    //Definir Roles a partir do banco de dados
    async jwt({ token, account, user, profile }) {
      if (user) {
        const email = user.email;
        if (email?.endsWith("@acosvital.com.br")) {
          token.role = "user";
        }

        if (email === "robert.stoco@acosvital.com.br") {
          token.role = "admin";
        }
      }
      return token;
    },

    // Adiciona a role no session para ficar visivel no frontend (session.user.role)
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId;
        session.user.role = token.role;
        session.user.permissions = token.permissions;
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