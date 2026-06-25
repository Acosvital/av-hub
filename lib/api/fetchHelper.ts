export async function apiFetch<T = unknown>(
  url: string,
  context: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.text().catch(() => '(sem corpo)');
    console.error(`${context} — status ${res.status}: ${body}`);
    throw new Error(`${context} (status ${res.status})`);
  }
  return res.json();
}
