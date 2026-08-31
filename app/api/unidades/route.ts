import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/fetchHelper';
import { requirePermission } from '@/lib/api/requirePermission';
import { comEscopoUnidade } from '@/lib/api/escopoUnidade';
import { assinarUrlFoto } from '@/lib/s3/fotos';
import { UnidadeProps } from '@/app/(protected)/cadastros/auxiliares/unidades/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const params = new URLSearchParams();
    [
      'page',
      'limit',
      'razao_social',
      'nome_fantasia',
      'cnpj',
      'tipo_unidade',
      'cidade',
      'estado',
    ].forEach((key) => {
      const value = searchParams.get(key);
      if (value !== null) params.set(key, value);
    });
    const data = await apiFetch<{ unidades: UnidadeProps[]; total: number }>(
      await comEscopoUnidade(`${process.env.API_URL}/unidades?${params}`),
      'Erro ao buscar unidades',
      {
        headers: { 'x-api-key': process.env.API_KEY! },
        cache: 'no-store',
      }
    );

    // foto_url guarda a key do objeto no S3 (bucket privado) — resolve pra
    // URL assinada aqui, sem alterar o valor que será regravado no PUT/POST.
    const unidades = await Promise.all(
      (data.unidades ?? []).map(async (unidade) => ({
        ...unidade,
        foto_signed_url: unidade.foto_url ? await assinarUrlFoto('empresa', unidade.foto_url) : null,
      }))
    );

    return NextResponse.json({ ...data, unidades });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const denied = await requirePermission('unidades', 'pode_criar');
  if (denied) return denied;
  try {
    const body = await request.json();
    const data = await apiFetch(await comEscopoUnidade(`${process.env.API_URL}/unidades`), 'Erro ao criar unidade', {
      method: 'POST',
      headers: { 'x-api-key': process.env.API_KEY!, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
