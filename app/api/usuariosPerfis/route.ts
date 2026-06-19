import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const params = new URLSearchParams();

        ['page', 'limit', 'username', 'email', 'ativo',].forEach((key) => {
            const value = searchParams.get(key);
            if (value !== null) params.set(key, value);
        })

        const response = await fetch(`${process.env.API_URL}/usuarios_perfis?${params}`, {
            headers: { 'x-api-key': process.env.API_KEY! },
            cache: 'no-store',
        })

        if (!response.ok) throw new Error('Error ao buscar Usuarios X Perfis');
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const response = await fetch(`${process.env.API_URL}/usuarios_perfis`, {
            method: 'POST',
            headers: {
                'x-api-key': process.env.API_KEY!,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) throw new Error('Erro ao criar usuário');
        const data = await response.json();
        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}