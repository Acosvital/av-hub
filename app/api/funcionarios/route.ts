import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/fetchHelper';
import { requirePermission } from '@/lib/api/requirePermission';
import { comEscopoUnidade } from '@/lib/api/escopoUnidade';
import { assinarUrlFoto } from '@/lib/s3/fotos';
import { FuncionarioProps } from '@/app/(protected)/rh/funcionarios/types';

export async function GET(request: NextRequest) {
  const denied = await requirePermission('funcionarios', 'pode_visualizar');
  if (denied) return denied;
  try {
    const { searchParams } = request.nextUrl;
    const params = new URLSearchParams();
    ['page', 'limit', 'nome_completo', 'email', 'codigo_empresa', 'id_setor', 'id_cargo'].forEach((key) => {
      const value = searchParams.get(key);
      if (value !== null) params.set(key, value);
    });
    const data = await apiFetch<{ funcionarios: FuncionarioProps[]; total: number }>(
      await comEscopoUnidade(`${process.env.API_URL}/funcionarios?${params}`),
      'Erro ao buscar funcionários',
      {
        headers: { 'x-api-key': process.env.API_KEY! },
        cache: 'no-store',
      }
    );

    // photo_url guarda a key do objeto no S3 (bucket privado) — resolve pra
    // URL assinada aqui, sem alterar o valor que será regravado no PUT/POST.
    const funcionarios = await Promise.all(
      (data.funcionarios ?? []).map(async (funcionario) => ({
        ...funcionario,
        photo_signed_url: funcionario.photo_url ? await assinarUrlFoto('pessoas', funcionario.photo_url) : null,
      }))
    );

    return NextResponse.json({ ...data, funcionarios });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const denied = await requirePermission('funcionarios', 'pode_criar');
  if (denied) return denied;
  try {
    const body = await request.json();
    const data = await apiFetch(
      await comEscopoUnidade(`${process.env.API_URL}/funcionarios`),
      'Erro ao criar funcionário',
      {
        method: 'POST',
        headers: { 'x-api-key': process.env.API_KEY!, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
