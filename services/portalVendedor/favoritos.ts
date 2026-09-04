import { apiFetch } from '@/lib/api/fetchHelper';

export interface FavoritoProps {
  id: string;
  id_usuario: string;
  tipo: 'cliente' | 'pedido';
  referencia_id: string;
  codigo_empresa: string;
  created_at: string;
}

interface FavoritosResponse {
  data: FavoritoProps[];
}

export async function getFavoritos() {
  return apiFetch<FavoritosResponse>('/api/meus-favoritos', 'Erro ao buscar favoritos');
}

export async function criarFavorito(
  tipo: 'cliente' | 'pedido',
  referenciaId: string,
  codigoEmpresa: string
) {
  return apiFetch<FavoritoProps>('/api/meus-favoritos', 'Erro ao favoritar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tipo, referencia_id: referenciaId, codigo_empresa: codigoEmpresa }),
  });
}

export async function removerFavorito(id: string) {
  return apiFetch(`/api/meus-favoritos/${id}`, 'Erro ao remover favorito', {
    method: 'DELETE',
  });
}
