'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { MdDarkMode, MdLightMode } from 'react-icons/md';
import styles from './ThemeToggle.module.css';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Evita erro de hidratação no Next
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = theme === 'dark';

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