import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const params = new URLSearchParams();

        ['page', 'limit', 'fornecedor', 'familia', 'descricao',].forEach((key) => {
            const value = searchParams.get(key);
            if (value !== null) params.set(key, value);
        });
        const response = await fetch(
            `${process.env.API_URL}/catalogo_de_produtos?${params}`,
            {
                headers: {
                    'x-api-key': process.env.API_KEY!,
                },
                cache: 'no-store',
            }
        );

        if (!response.ok) {
            throw new Error('Erro ao buscar produtos');
        }
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}