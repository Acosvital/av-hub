import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id_usuario) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const res = await fetch(
      `${process.env.API_URL}/permissoes_usuario/menu/${session.user.id_usuario}`,
      {
        headers: { "x-api-key": process.env.API_KEY! },
        cache: "no-store",
      }
    );

    if (!res.ok) throw new Error("Erro ao buscar menu");

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
