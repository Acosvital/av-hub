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
export default function useAutoRefresh(callback: () => void, intervalMs: number = DASHBOARD_REFRESH_INTERVAL_MS) {
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    function start() {
      if (intervalId !== null) return;
      intervalId = setInterval(() => callbackRef.current(), intervalMs);
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
        callbackRef.current();
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
