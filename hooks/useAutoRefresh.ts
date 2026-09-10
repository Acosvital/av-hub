import { useEffect, useRef } from 'react';

// Intervalo padrão dos dashboards — mais curto que isso e a lista de
// vendedores/pedidos praticamente não muda entre um tick e outro (o gargalo
// é a sincronização do Omie, não o backend), só geraria request à toa.
export const DASHBOARD_REFRESH_INTERVAL_MS = 60_000;

// Refetch silencioso em segundo plano (sem religar loading/skeleton — quem
// chama decide isso passando um callback que já sabe pedir os dados "quieto").
// Pausa quando a aba sai de foco (visibilitychange) pra não gastar request
// com a página escondida, e já refaz na volta em vez de esperar o próximo
// tick (que podia demorar quase o intervalo inteiro pra mostrar dado novo).
export default function useAutoRefresh(
  callback: () => void | Promise<void>,
  intervalMs: number = DASHBOARD_REFRESH_INTERVAL_MS
) {
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  });

  // Alguns dos endpoints agregados que os dashboards chamam já demoraram
  // 100s+ "frios" (consulta pesada, sem codigo_empresa) — bem mais que o
  // intervalo de 1min. Sem essa trava, cada tick empilharia mais uma
  // chamada em cima da anterior ainda em andamento, piorando exatamente a
  // lentidão que causa o problema.
  const emVooRef = useRef(false);

  async function runIfIdle() {
    if (emVooRef.current) return;
    emVooRef.current = true;
    try {
      await callbackRef.current();
    } finally {
      emVooRef.current = false;
    }
  }

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    function start() {
      if (intervalId !== null) return;
      intervalId = setInterval(() => runIfIdle(), intervalMs);
    }

    function stop() {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        stop();
      } else {
        runIfIdle();
        start();
      }
    }

    if (!document.hidden) start();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [intervalMs]);
}
