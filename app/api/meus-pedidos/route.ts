import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/fetchHelper';
import { requirePermission } from '@/lib/api/requirePermission';
import { resolverVendedoresSessao } from '@/lib/api/portalVendedor';
import { PedidoVendedorProps } from '@/app/(protected)/meus-pedidos/types';

interface VendasBaseResponse {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  data: PedidoVendedorProps[];
}

const FILTROS_REPASSADOS = ['numero_pedido', 'data_inicio', 'data_fim', 'grupo'];

export async function GET(request: NextRequest) {
  const denied = await requirePermission('meus-pedidos', 'pode_visualizar');
  if (denied) return denied;

  try {
    const vendedores = await resolverVendedoresSessao();
    if (!vendedores) {
      return NextResponse.json({ vinculado: false, data: [], total: 0, page: 1, limit: 0, total_pages: 0 });
    }

    const { searchParams } = request.nextUrl;
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 25;
    const headers = { 'x-api-key': process.env.API_KEY! };

    const filtrosComuns = new URLSearchParams();
    FILTROS_REPASSADOS.forEach((key) => {
      const value = searchParams.get(key);
      if (value) filtrosComuns.set(key, value);
    });

    // Vínculo único: aproveita a paginação do backend direto, sem agregação
    // em memória.
    if (vendedores.length === 1) {
      const params = new URLSearchParams(filtrosComuns);
      params.set('cod_vendedor', vendedores[0].codigo_vendedor_omie);
      params.set('codigo_empresa', vendedores[0].codigo_empresa);
      params.set('page', String(page));
      params.set('limit', String(limit));
      const resposta = await apiFetch<VendasBaseResponse>(
        `${process.env.API_URL}/vendas_base?${params}`,
        'Erro ao buscar meus pedidos',
        { headers, cache: 'no-store' }
      );
      return NextResponse.json({ vinculado: true, ...resposta });
    }

    // Vendedor com mais de uma unidade: busca cada vínculo por inteiro
    // (backend não aceita lista de cod_vendedor) e pagina em memória.
    const listas = await Promise.all(
      vendedores.map((v) => {
        const params = new URLSearchParams(filtrosComuns);
        params.set('cod_vendedor', v.codigo_vendedor_omie);
        params.set('codigo_empresa', v.codigo_empresa);
        params.set('limit', '500');
        return apiFetch<VendasBaseResponse>(
          `${process.env.API_URL}/vendas_base?${params}`,
          'Erro ao buscar meus pedidos',
          { headers, cache: 'no-store' }
        )
          .then((r) => r.data ?? [])
          .catch(() => []);
      })
    );

    const todos = listas
      .flat()
      .sort((a, b) => String(b.data_inclusao).localeCompare(String(a.data_inclusao)));
    const total = todos.length;
    const inicio = (page - 1) * limit;
    const pagina = todos.slice(inicio, inicio + limit);

    return NextResponse.json({
      vinculado: true,
      data: pagina,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
