import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/fetchHelper';

// Dicionário dos níveis hierárquicos (nome/cor/categoria) — fonte única de
// verdade compartilhada com o Organograma, substituindo o dicionário que
// antes vivia hardcoded em cada frontend (ver
// docs/organograma-integridade-schema.md, item 1). Sem paginação — tabela
// pequena, lida inteira de uma vez.
export async function GET() {
  try {
    // A API externa envolve a listagem no envelope padrão de paginação
    // ({ total, data: [...] }) mesmo esta rota não tendo paginação de
    // verdade — desembrulha aqui pra devolver o array puro que
    // getNiveisHierarquicos() (nivelHierarquico.ts) espera.
    const response = await apiFetch<{ data: unknown }>(
      `${process.env.API_URL}/niveis_hierarquicos`,
      'Erro ao buscar níveis hierárquicos',
      { headers: { 'x-api-key': process.env.API_KEY! }, cache: 'no-store' }
    );
    return NextResponse.json(response.data ?? []);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
