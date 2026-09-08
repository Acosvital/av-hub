// Vendedor com mais de um vínculo (vendedor.codigo_vendedor_omie em mais de
// uma empresa): cada vínculo é buscado à parte (backend não aceita lista de
// cod_vendedor) e o resultado combinado precisa ser ordenado/paginado em
// memória, já que nenhuma chamada isolada tem a visão do total. Antes
// duplicado em app/api/meus-pedidos e app/api/minhas-notas.
export interface PaginaOrdenada<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export function paginarOrdenadoPorData<T>(
  listas: T[][],
  campoData: keyof T,
  page: number,
  limit: number
): PaginaOrdenada<T> {
  const todos = listas
    .flat()
    .sort((a, b) => String(b[campoData]).localeCompare(String(a[campoData])));
  const total = todos.length;
  const inicio = (page - 1) * limit;
  const data = todos.slice(inicio, inicio + limit);

  return { data, total, page, limit, total_pages: Math.ceil(total / limit) };
}
