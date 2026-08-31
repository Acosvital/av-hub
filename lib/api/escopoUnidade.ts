import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Acrescenta id_usuario_sessao à URL quando há sessão — é o que permite ao
// backend aplicar o escopo por unidade (auth.usuarios_unidades: usuário
// vinculado a uma unidade só vê/grava setores, cargos, funcionários e
// unidades daquela unidade; sem vínculo, irrestrito). Sem sessão (ou sem
// id_usuario), a URL sai igual — o backend trata como irrestrito, mesmo
// comportamento de antes desse escopo existir.
export async function comEscopoUnidade(url: string): Promise<string> {
  const session = await getServerSession(authOptions);
  const idUsuario = session?.user?.id_usuario;
  if (!idUsuario) return url;
  const separador = url.includes('?') ? '&' : '?';
  return `${url}${separador}id_usuario_sessao=${idUsuario}`;
}
