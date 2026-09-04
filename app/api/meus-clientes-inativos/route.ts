import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/fetchHelper';
import { requirePermission } from '@/lib/api/requirePermission';
import { resolverVendedoresSessao } from '@/lib/api/portalVendedor';

export interface ClienteInativoProps {
  codigo_empresa: string;
  cod_vendedor: string;
  codigo_cliente: string;
  vendedor: string;
  cliente: string;
  ultima_compra: string;
  dias_sem_comprar: number;
  valor_ultima_compra: string;
  qtd_pedidos: string;
  valor_total_historico: string;
}

interface ClientesInativosResponse {
  data: ClienteInativoProps[];
}

export async function GET(request: NextRequest) {
  const denied = await requirePermission('meu-dashboard', 'pode_visualizar');
  if (denied) return denied;

  try {
    const vendedores = await resolverVendedoresSessao();
    if (!vendedores) {
      return NextResponse.json({ vinculado: false, data: [] });
    }

    const diasSemComprar = request.nextUrl.searchParams.get('dias_sem_comprar') ?? '90';
    const headers = { 'x-api-key': process.env.API_KEY! };

    const listas = await Promise.all(
      vendedores.map((v) => {
        const params = new URLSearchParams({
          cod_vendedor: v.codigo_vendedor_omie,
          dias_sem_comprar: diasSemComprar,
          codigo_empresa: v.codigo_empresa,
        });
        return apiFetch<ClientesInativosResponse>(
          `${process.env.API_URL}/clientes_inativos?${params}`,
          'Erro ao buscar clientes inativos',
          { headers, cache: 'no-store' }
        )
          .then((r) => r.data ?? [])
          .catch(() => []);
      })
    );

    const todos = listas.flat().sort((a, b) => b.dias_sem_comprar - a.dias_sem_comprar);

    return NextResponse.json({ vinculado: true, data: todos });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
