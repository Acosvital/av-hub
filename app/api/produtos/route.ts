import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const page = req.nextUrl.searchParams.get('page');
    const limit = req.nextUrl.searchParams.get('limit');
    const fornecedor = req.nextUrl.searchParams.get('fornecedor');
    const familia = req.nextUrl.searchParams.get('familia'); 
    const descricao = req.nextUrl.searchParams.get('descricao'); 
    try {
        const response = await fetch(
            `http://72.62.137.208:3000/catalogo_de_produtos?page=${page}&limit=${limit}&nome_fantasia=${fornecedor}&familia=${familia}&descricao=${descricao}`,
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
        return NextResponse.json(
            { error: 'Erro interno' },
            { status: 500 }
        );
    }
}