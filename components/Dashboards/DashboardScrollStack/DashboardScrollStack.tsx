'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './DashboardScrollStack.module.css';

interface DashboardScrollStackProps {
  /** Cada painel é um dashboard completo. A partir do 2º, fica "encaixado" abaixo do anterior. */
  panels: React.ReactNode[];
  /** Cor dos indicadores de posição. */
  accentColor?: string;
}

const TRANSITION_MS = 650;
const WHEEL_THRESHOLD = 12;
const TOUCH_THRESHOLD = 40;
const DESKTOP_QUERY = '(min-width: 1025px)';

interface Transition {
  from: number;
  to: number;
  dir: 1 | -1;
}

/**
 * Sobe a árvore a partir do alvo do evento procurando um ancestral com
 * scroll interno próprio (ex: a lista de ranking). Enquanto o mouse/toque
 * estiver sobre uma área assim, o gesto sempre rola esse elemento
 * nativamente — nunca troca de painel, nem quando a lista chega ao fim
 * (senão o usuário "escorrega" pro próximo dashboard sem querer).
 */
const isWithinScrollableRegion = (target: EventTarget | null, boundary: HTMLElement): boolean => {
  let node = target instanceof HTMLElement ? target : null;

  while (node && node !== boundary.parentElement) {
    const canScrollY = node.scrollHeight > node.clientHeight;
    if (canScrollY) {
      const style = window.getComputedStyle(node);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') return true;
    }
    if (node === boundary) break;
    node = node.parentElement;
  }
  return false;
};

/**
 * Empilha múltiplos dashboards em uma só página. Em telas desktop (onde o
 * grid de dashboard já ocupa 100% do viewport sem scroll nativo), a rolagem
 * (wheel/touch/teclado) é interceptada para trocar de painel com uma
 * animação de "desencaixe/encaixe". Em telas menores, os painéis ficam
 * simplesmente empilhados em fluxo normal (o grid já reflui para altura
 * automática nesse breakpoint, então o scroll nativo da página resolve).
 */
const DashboardScrollStack = ({ panels, accentColor = 'var(--foreground-secondary)' }: DashboardScrollStackProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [transition, setTransition] = useState<Transition | null>(null);
  const lockRef = useRef(false);
  const touchStartYRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback(
    (dir: 1 | -1) => {
      if (lockRef.current) return;
      const to = activeIndex + dir;
      if (to < 0 || to >= panels.length) return;

      lockRef.current = true;
      setTransition({ from: activeIndex, to, dir });
      window.setTimeout(() => {
        setActiveIndex(to);
        setTransition(null);
        lockRef.current = false;
      }, TRANSITION_MS);
    },
    [activeIndex, panels.length]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el || panels.length < 2) return;

    const isDesktop = () => window.matchMedia(DESKTOP_QUERY).matches;

    const onWheel = (e: WheelEvent) => {
      if (!isDesktop() || Math.abs(e.deltaY) < WHEEL_THRESHOLD) return;
      if (isWithinScrollableRegion(e.target, el)) return;
      e.preventDefault();
      goTo(e.deltaY > 0 ? 1 : -1);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (!isDesktop()) return;
      touchStartYRef.current = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDesktop() || touchStartYRef.current === null) return;
      const currentY = e.touches[0].clientY;
      const delta = touchStartYRef.current - currentY;

      if (isWithinScrollableRegion(e.target, el)) {
        touchStartYRef.current = currentY;
        return;
      }
      if (Math.abs(delta) < TOUCH_THRESHOLD) return;
      e.preventDefault();
      touchStartYRef.current = null;
      goTo(delta > 0 ? 1 : -1);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!isDesktop()) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        goTo(1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        goTo(-1);
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('keydown', onKeyDown);

    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('keydown', onKeyDown);
    };
  }, [goTo, panels.length]);

  const goToIndex = (index: number) => {
    if (index === activeIndex || lockRef.current) return;
    goTo(index > activeIndex ? 1 : -1);
  };

  return (
    <div className={styles.stack} ref={containerRef} tabIndex={0}>
      {panels.map((panel, index) => {
        let state = styles.hidden;
        if (!transition) {
          state = index === activeIndex ? styles.active : styles.hidden;
        } else if (index === transition.from) {
          state = styles.leaving;
        } else if (index === transition.to) {
          state = styles.entering;
        }

        return (
          <div
            key={index}
            className={`${styles.panel} ${state}`}
            style={transition ? ({ '--dir': transition.dir } as React.CSSProperties) : undefined}
            aria-hidden={index !== (transition?.to ?? activeIndex)}
          >
            {panel}
          </div>
        );
      })}
      {panels.length > 1 && (
        <div className={styles.indicators}>
          {panels.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Ir para o dashboard ${index + 1}`}
              className={styles.dot}
              style={
                index === (transition?.to ?? activeIndex)
                  ? ({ '--dot-color': accentColor } as React.CSSProperties)
                  : undefined
              }
              data-active={index === (transition?.to ?? activeIndex)}
              onClick={() => goToIndex(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardScrollStack;
