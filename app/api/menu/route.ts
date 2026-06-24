import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { apiFetch } from "@/lib/api/fetchHelper";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id_usuario) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const data = await apiFetch<{ menu?: unknown[] }>(
      `${process.env.API_URL}/permissoes_usuario/menu/${session.user.id_usuario}`,
      "Erro ao buscar menu",
      { headers: { "x-api-key": process.env.API_KEY! }, cache: "no-store" }
    );

    return NextResponse.json(data.menu ?? []);
  } catch {
    return NextResponse.json([]);
  }
}
