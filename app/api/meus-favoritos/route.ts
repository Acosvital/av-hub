import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/fetchHelper';
import { requirePermission } from '@/lib/api/requirePermission';
import { obterIdUsuarioSessao } from '@/lib/api/portalVendedor';

export interface FavoritoProps {
  id: string;
  id_usuario: string;
  tipo: 'cliente' | 'pedido';
  referencia_id: string;
  codigo_empresa: string;
  created_at: string;
}

// A resposta real usa a chave `favoritos`, não `data` como o contrato
// original sugeria (confirmado ao vivo, 04/09):
// { id_usuario, total, favoritos: [...] }
interface FavoritosResponse {
  favoritos: FavoritoProps[];
}

// Favoritos são só do próprio usuário — id_usuario nunca vem do request,
// sempre resolvido da sessão (mesma fronteira de segurança do resto do
// portal, ver docs/portal-vendedor/plano-portal-vendedor.md, seção 2).
export async function GET() {
  const denied = await requirePermission('meus-pedidos', 'pode_visualizar');
  if (denied) return denied;

  try {
    const idUsuario = await obterIdUsuarioSessao();
    if (!idUsuario) return NextResponse.json({ data: [] });

    const resposta = await apiFetch<FavoritosResponse>(
      `${process.env.API_URL}/usuarios/${idUsuario}/favoritos`,
      'Erro ao buscar favoritos',
      { headers: { 'x-api-key': process.env.API_KEY! }, cache: 'no-store' }
    );
    return NextResponse.json({ data: resposta.favoritos ?? [] });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const denied = await requirePermission('meus-pedidos', 'pode_visualizar');
  if (denied) return denied;

  try {
    const idUsuario = await obterIdUsuarioSessao();
    if (!idUsuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    if (body?.tipo !== 'cliente' && body?.tipo !== 'pedido') {
      return NextResponse.json({ error: 'tipo deve ser "cliente" ou "pedido"' }, { status: 400 });
    }
    if (!body?.referencia_id) {
      return NextResponse.json({ error: 'referencia_id é obrigatório' }, { status: 400 });
    }
    // A implementação real diverge do contrato original em 2 pontos,
    // descobertos ao vivo (04/09) via 400 do backend: exige `codigo_empresa`
    // (referencia_id só é único dentro de uma unidade) e `id` gerado pelo
    // cliente (a tabela real não tem DEFAULT gen_random_uuid() como o
    // contrato sugeria).
    if (!body?.codigo_empresa) {
      return NextResponse.json({ error: 'codigo_empresa é obrigatório' }, { status: 400 });
    }

    const data = await apiFetch(
      `${process.env.API_URL}/usuarios/${idUsuario}/favoritos`,
      'Erro ao favoritar',
      {
        method: 'POST',
        headers: { 'x-api-key': process.env.API_KEY!, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: randomUUID(),
          tipo: body.tipo,
          referencia_id: String(body.referencia_id),
          codigo_empresa: String(body.codigo_empresa),
        }),
      }
    );
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
