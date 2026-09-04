import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/fetchHelper';
import { requirePermission } from '@/lib/api/requirePermission';
import { resolverVendedoresSessao } from '@/lib/api/portalVendedor';
import { NotaFiscalVendedorProps } from '@/app/(protected)/minhas-notas/types';

interface NfClassifiedResponse {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  data: NotaFiscalVendedorProps[];
}

const FILTROS_REPASSADOS = ['numero_nf', 'numero_pedido', 'data_inicio', 'data_fim', 'grupo_deducao'];

export async function GET(request: NextRequest) {
  const denied = await requirePermission('minhas-notas', 'pode_visualizar');
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

    if (vendedores.length === 1) {
      const params = new URLSearchParams(filtrosComuns);
      params.set('cod_vendedor', vendedores[0].codigo_vendedor_omie);
      params.set('page', String(page));
      params.set('limit', String(limit));
      const resposta = await apiFetch<NfClassifiedResponse>(
        `${process.env.API_URL}/nf_classified?${params}`,
        'Erro ao buscar minhas notas fiscais',
        { headers, cache: 'no-store' }
      );
      return NextResponse.json({ vinculado: true, ...resposta });
    }

    // nf_classified não filtra por codigo_empresa isolado do resto (é
    // deduzido do próprio pedido) — mas cod_vendedor sozinho já isola cada
    // vínculo corretamente, então cada chamada usa só o código do vendedor.
    const listas = await Promise.all(
      vendedores.map((v) => {
        const params = new URLSearchParams(filtrosComuns);
        params.set('cod_vendedor', v.codigo_vendedor_omie);
        params.set('limit', '500');
        return apiFetch<NfClassifiedResponse>(
          `${process.env.API_URL}/nf_classified?${params}`,
          'Erro ao buscar minhas notas fiscais',
          { headers, cache: 'no-store' }
        )
          .then((r) => r.data ?? [])
          .catch(() => []);
      })
    );

    const todas = listas
      .flat()
      .sort((a, b) => String(b.data_emissao).localeCompare(String(a.data_emissao)));
    const total = todas.length;
    const inicio = (page - 1) * limit;
    const pagina = todas.slice(inicio, inicio + limit);

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
