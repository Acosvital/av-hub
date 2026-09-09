// Carrega o status HTTP original — sem isso, quem chama só enxerga "deu
// erro" e não consegue distinguir um 404 legítimo ("sem resultado pra esse
// filtro") de um 500 de verdade, o que faz rota por rota reagir igual aos
// dois casos (ex.: mostrar "erro interno" genérico pra uma busca que
// simplesmente não achou nada).
export class ApiFetchError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiFetchError';
    this.status = status;
  }
}

export async function apiFetch<T = unknown>(
  url: string,
  context: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.text().catch(() => '(sem corpo)');
    console.error(`${context} — status ${res.status}: ${body}`);
    throw new ApiFetchError(`${context} (status ${res.status})`, res.status);
  }
  return res.json();
}
