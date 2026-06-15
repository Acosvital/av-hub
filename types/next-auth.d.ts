export {};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: "admin" | "user" | "vendedor";
      permissions: string[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    role?: "admin" | "user" | "vendedor";
    permissions: string[];
  }
}