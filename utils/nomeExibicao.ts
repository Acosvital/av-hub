// Preposições/artigos que nunca carregam o sobrenome que identifica a
// pessoa — pular na hora de escolher a segunda palavra do nome resumido,
// senão "Hugo dos Santos" vira "Hugo Dos" em vez de "Hugo Santos".
const CONECTIVOS = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);

// Resume um nome completo pro primeiro nome + o próximo sobrenome
// relevante (pulando conectivos), pra caber em cards de dashboard sem
// cortar no meio de "dos"/"da"/etc. Nomes de uma palavra só voltam como
// estão.
export function nomeExibicaoResumido(nomeCompleto: string): string {
  const partes = nomeCompleto.trim().split(/\s+/).filter(Boolean);
  if (partes.length <= 1) return nomeCompleto.trim();

  const primeiro = partes[0];
  const segundo = partes.slice(1).find((parte) => !CONECTIVOS.has(parte.toLowerCase()));
  return segundo ? `${primeiro} ${segundo}` : primeiro;
}
