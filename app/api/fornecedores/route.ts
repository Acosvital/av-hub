import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const search = req.nextUrl.searchParams.get('search');
    try {
        const response = await fetch(
            `${process.env.API_URL}/fornecedores_com_produtos?nome_fantasia=${search}`,
            {
                headers: {
                    'x-api-key': process.env.API_KEY!,
                },
                cache: 'no-store',
            }
        );

        if (!response.ok) {
            throw new Error('Erro ao buscar fornecedores');
        }
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: 'Erro interno' },
            { status: 500 }
        );
    }
}