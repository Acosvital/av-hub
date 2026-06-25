import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { hasPermission } from '@/lib/permissions';
import type { MenuItem } from '@/components/Layout/AppLayout/Menu/MenuItem/MenuItem';

export type Acao = 'pode_visualizar' | 'pode_criar' | 'pode_editar' | 'pode_deletar';


//Custom hook que verifica as permissões do usuário logado, e tela atual:
export function usePermission() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const menu: MenuItem[] = session?.user?.menu ?? [];

  const telaId = pathname.split('/').filter(Boolean).at(-1) ?? '';

  const can = (acao: Acao, telaIdOverride?: string): boolean =>
    hasPermission(menu, telaIdOverride ?? telaId, acao);

  return { can, telaId };
}
