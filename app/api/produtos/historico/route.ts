import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const produto = req.nextUrl.searchParams.get('produto');
    const parceiro = req.nextUrl.searchParams.get('parceiro');
    try {
        const response = await fetch(
            `${process.env.API_URL}/historico_precos?id_produto=${produto}&id_parceiro=${parceiro}`,
            {
                headers: {
                    'x-api-key': process.env.API_KEY!,
                },
                cache: 'no-store',
            }
        );

        if (!response.ok) {
            throw new Error('Erro ao buscar historico de preços');
        }
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: 'Erro interno' },
            { status: 500 }
        );
    }
}