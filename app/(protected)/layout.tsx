import Layout from "@/components/Layout/AppLayout/Layout";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <Layout>{children}</Layout>;
}