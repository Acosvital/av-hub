import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { hasPermission, type Acao } from '@/lib/permissions';

export async function requirePermission(telaId: string, acao: Acao): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);
  const menu = session?.user?.menu ?? [];
  if (!hasPermission(menu, telaId, acao)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }
  return null;
}
