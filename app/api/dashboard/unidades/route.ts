import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { apiFetch } from '@/lib/api/fetchHelper';

export interface UnidadeResumoProps {
  id: string;
  nome_fantasia: string;
}

// Versão enxuta de GET /api/unidades, só pra alimentar o seletor "Empresa"
// do cabeçalho dos dashboards — de propósito NÃO usa requirePermission
// ('unidades', 'pode_visualizar'), porque essa é a permissão da tela de
// CADASTRO de unidades (administrativa), não de "pode ver dashboards". Um
// perfil focado só em dashboards (ex.: Gerência) não tem motivo pra precisar
// de acesso ao cadastro de unidades só pra filtrar por empresa — mas
// dependia exatamente disso antes desta rota existir, deixando o seletor
// sempre vazio (só "Todas as empresas") pra esses perfis. Nome de empresa
// não é dado sensível: já aparece solto em outros lugares deste mesmo
// header (resultado de busca de pedidos/notas), sem gate nenhum.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  try {
    const data = await apiFetch<{ unidades: UnidadeResumoProps[] }>(
      `${process.env.API_URL}/unidades?limit=100`,
      'Erro ao buscar unidades',
      { headers: { 'x-api-key': process.env.API_KEY! }, cache: 'no-store' }
    );
    const unidades = (data.unidades ?? []).map((u) => ({ id: u.id, nome_fantasia: u.nome_fantasia }));
    return NextResponse.json({ unidades });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
