// Monograma (2 letras) a partir do nome/razão social do cliente — mesma
// ideia do Avatar de vendedor (iniciais), aplicada aos cartões de
// Meus Pedidos/Minhas Notas no lugar de um ícone genérico ("NF") que só
// repetia o que a tela já deixa óbvio pelo contexto.
export function iniciaisCliente(nome: string | null | undefined): string {
  if (!nome) return '—';
  const palavras = nome.trim().split(/\s+/).filter(Boolean);
  if (palavras.length === 0) return '—';
  if (palavras.length === 1) return palavras[0].slice(0, 2).toUpperCase();
  return (palavras[0][0] + palavras[1][0]).toUpperCase();
}
