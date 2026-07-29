import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { hasPermission, type Acao } from '@/lib/permissions';
import type { MenuItem } from '@/components/Layout/AppLayout/Menu/MenuItem/MenuItem';

export type { Acao };

//Custom hook que verifica as permissões do usuário logado, e tela atual:
export function usePermission() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const menu: MenuItem[] = session?.user?.menu ?? [];

  const telaId = pathname.split('/').filter(Boolean).at(-1) ?? '';

  const can = (acao: Acao, telaIdOverride?: string): boolean =>
    hasPermission(menu, telaIdOverride ?? telaId, acao);

  // Retorna true somente se o usuário tiver exatamente as ações informadas (nem mais, nem menos).
  // Ex: canOnly('pode_editar', 'pode_visualizar') é false para quem também tem pode_criar/pode_deletar.
  const canOnly = (...acoes: Acao[]): boolean => {
    const TODAS_ACOES: Acao[] = ['pode_visualizar', 'pode_criar', 'pode_editar', 'pode_deletar'];
    return TODAS_ACOES.every((acao) =>
      acoes.includes(acao) ? can(acao) : !can(acao),
    );
  };

  return { can, canOnly, telaId };
}
