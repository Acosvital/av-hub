// Heurísticas de "pra qual campo mandar esse texto de busca livre" — cada
// tela decide isso à sua própria maneira (os padrões abaixo NÃO são a mesma
// regra: número de pedido é só dígitos; CNPJ costuma vir com pontuação, então
// basta conter um dígito pra já preferir o filtro de CNPJ). Nomeadas aqui pra
// não ficarem como regex anônimo solto no meio do componente.
export function pareceNumeroPuro(texto: string): boolean {
  return /^\d+$/.test(texto);
}

export function pareceConterDigito(texto: string): boolean {
  return /\d/.test(texto);
}
