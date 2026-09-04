import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { hasPermission } from '@/lib/permissions';
import { uploadFoto, assinarUrlFoto, MIME_TYPES_PERMITIDOS, TAMANHO_MAXIMO_BYTES } from '@/lib/s3/fotos';
import type { S3Bucket } from '@/lib/s3/client';

const TELA_POR_BUCKET: Record<S3Bucket, string> = {
  pessoas: 'funcionarios',
  empresa: 'unidades',
};

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  const menu = session.user.menu ?? [];

  const formData = await request.formData();
  const bucket = formData.get('bucket');
  const file = formData.get('file');

  if (bucket !== 'pessoas' && bucket !== 'empresa') {
    return NextResponse.json({ error: 'Bucket inválido' }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 });
  }

  const tela = TELA_POR_BUCKET[bucket];
  const podeEnviar = hasPermission(menu, tela, 'pode_criar') || hasPermission(menu, tela, 'pode_editar');
  if (!podeEnviar) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  if (!MIME_TYPES_PERMITIDOS.includes(file.type)) {
    return NextResponse.json({ error: 'Formato de imagem não suportado (use JPG, PNG ou WebP)' }, { status: 400 });
  }
  if (file.size > TAMANHO_MAXIMO_BYTES) {
    return NextResponse.json({ error: 'Imagem excede o tamanho máximo de 5MB' }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const key = await uploadFoto(bucket, buffer, file.type);
    const url = await assinarUrlFoto(bucket, key);
    return NextResponse.json({ key, url });
  } catch (error) {
    console.error('Erro ao enviar imagem para o storage', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
