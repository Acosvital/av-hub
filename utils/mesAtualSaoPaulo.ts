// Calcula o mês/ano "corrente" e o primeiro/último dia desse mês sempre no
// fuso America/Sao_Paulo — nunca no fuso do processo (servidor pode rodar em
// UTC, browser pode estar em qualquer fuso do visitante). Usado tanto pelo
// BFF (app/api/comissoes/visao-geral/route.ts, pra decidir is_track_record e
// os defaults de mes/ano) quanto pela tela (app/(protected)/comissoes/
// visao-geral/page.tsx, pra saber qual é "o mês atual"), pra evitar duas
// implementações divergentes da mesma regra de fuso.
export interface MesAtualSaoPaulo {
  ano: number;
  mes: number; // 1-12
  primeiroDia: string; // AAAA-MM-DD
  ultimoDia: string; // AAAA-MM-DD
}

const pad2 = (n: number) => String(n).padStart(2, '0');

// Primeiro/último dia (AAAA-MM-DD) de um mes/ano arbitrário — extraído de
// obterMesAtualSaoPaulo pra ser reaproveitado pelo BFF de comissões/
// visao-geral, que recebe mes/ano da tela (não necessariamente o mês
// corrente) e precisa montar o range de data_inicio/data_fim exigido por
// /faturamento_planilha.
export function primeiroEUltimoDiaDoMes(ano: number, mes: number) {
  // Date.UTC(ano, mes, 0) — mes já é 1-based, então isso cai no "dia 0" do
  // mês seguinte (0-based), ou seja, o último dia do mês pedido.
  const ultimoDiaDoMes = new Date(Date.UTC(ano, mes, 0)).getUTCDate();

  return {
    primeiroDia: `${ano}-${pad2(mes)}-01`,
    ultimoDia: `${ano}-${pad2(mes)}-${pad2(ultimoDiaDoMes)}`,
  };
}

export function obterMesAtualSaoPaulo(referencia: Date = new Date()): MesAtualSaoPaulo {
  // en-CA formata como AAAA-MM-DD, então dá pra ler os componentes direto
  // sem depender de libs de data com plugin de timezone (o projeto usa
  // dayjs sem o plugin timezone/utc instalado).
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(referencia);
  const mapa = Object.fromEntries(partes.map((p) => [p.type, p.value])) as Record<string, string>;
  const ano = Number(mapa.year);
  const mes = Number(mapa.month);

  return { ano, mes, ...primeiroEUltimoDiaDoMes(ano, mes) };
}
