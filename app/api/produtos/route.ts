import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const response = await fetch(
            `http://72.62.137.208:3000/catalogo_de_produtos`,
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