import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { apiFetch } from '@/lib/api/fetchHelper';

export interface VendedorSessaoProps {
  codigo_vendedor_omie: string;
  codigo_empresa: string;
}

interface UsuarioBackendProps {
  id_funcionario: string | null;
}

interface VendedoresBackendResponse {
  data: VendedorSessaoProps[];
}

/**
 * Resolve o(s) vendedor(es) vinculados ao usuário logado, inteiramente a partir
 * da sessão (id_usuario -> usuarios.id_funcionario -> vendedores.id_funcionario).
 * Nunca aceita codigo_vendedor/id_funcionario vindo do request — é a fronteira
 * de segurança do autoatendimento (docs/portal-vendedor/plano-portal-vendedor.md, seção 2).
 * Retorna null quando não há vínculo (usuário sem id_funcionario, ou sem
 * nenhum vendedor apontando pra esse funcionário).
 */
export async function resolverVendedoresSessao(): Promise<VendedorSessaoProps[] | null> {
  const session = await getServerSession(authOptions);
  const idUsuario = session?.user?.id_usuario;
  if (!idUsuario) return null;

  const usuario = await apiFetch<UsuarioBackendProps>(
    `${process.env.API_URL}/usuarios/${idUsuario}`,
    'Erro ao buscar usuário da sessão',
    { headers: { 'x-api-key': process.env.API_KEY! }, cache: 'no-store' }
  ).catch(() => null);

  if (!usuario?.id_funcionario) return null;

  const vendedores = await apiFetch<VendedoresBackendResponse>(
    `${process.env.API_URL}/vendedores?id_funcionario=${usuario.id_funcionario}&limit=50`,
    'Erro ao buscar vendedores vinculados ao usuário',
    { headers: { 'x-api-key': process.env.API_KEY! }, cache: 'no-store' }
  ).catch(() => null);

  return vendedores?.data?.length ? vendedores.data : null;
}

/**
 * Só o `id_usuario` da sessão (sem resolver vendedor) — usado pelas rotas de
 * favoritos, que são por usuário, não por vendedor. Mesma fonte
 * (`getServerSession`), nunca aceita id vindo do request.
 */
export async function obterIdUsuarioSessao(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id_usuario ?? null;
}
