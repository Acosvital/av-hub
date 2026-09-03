import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/fetchHelper';

// Sugestão de vínculo com funcionário (mesmo nome já vinculado em outra
// unidade — ver docs/contrato-vinculo-vendedor-funcionario.md, item 3.1).
// Sem requirePermission aqui, mesmo padrão do GET /api/vendedores (irmão
// desta rota): é leitura auxiliar da mesma tela, não uma ação de escrita.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await apiFetch(
      `${process.env.API_URL}/vendedores/${id}/sugestoes`,
      'Erro ao buscar sugestão de vínculo',
      {
        headers: { 'x-api-key': process.env.API_KEY! },
        cache: 'no-store',
      }
    );
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
