import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { hasPermission, type Acao } from '@/lib/permissions';

// Aceita mais de uma tela quando o mesmo endpoint alimenta tanto a tela
// dona do dado quanto um card-resumo embutido em outra tela (ex.:
// faturamento-por-tipo é usado pela tela "Faturamento por tipo" E pelo
// card "Faturamento por tipo" dentro de "Faturamento") — qualquer uma
// das telas listadas já libera o acesso.
export async function requirePermission(
  telaId: string | string[],
  acao: Acao
): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);
  const menu = session?.user?.menu ?? [];
  const telaIds = Array.isArray(telaId) ? telaId : [telaId];
  if (!telaIds.some((id) => hasPermission(menu, id, acao))) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }
  return null;
}
