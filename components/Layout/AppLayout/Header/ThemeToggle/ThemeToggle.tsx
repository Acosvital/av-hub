'use client';

import { useTheme } from 'next-themes';
import { startTransition, useEffect, useState } from 'react';
import { MdDarkMode, MdLightMode } from 'react-icons/md';
import styles from './ThemeToggle.module.css';

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Evita erro de hidratação no Next
  useEffect(() => {
    startTransition(() => setMounted(true));
  }, []);

  if (!mounted) return null;

  // resolvedTheme (não theme) — com defaultTheme="system", "theme" fica
  // "system" até o usuário escolher um tema explicitamente, mesmo com o
  // app já resolvido pra escuro/claro. Usar "theme" aqui mostrava o ícone
  // errado e fazia o primeiro clique não surtir efeito visual nenhum (só
  // trocava "system" por "dark" de novo).
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      className={styles.toggleButton}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="Alternar tema"
    >
      {isDark ? <MdLightMode /> : <MdDarkMode />}
    </button>
  );
}
