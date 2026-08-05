import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import Providers from '@/providers';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '600', '700', '900'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Aços Hub',
  description: 'Sistema Auxiliar dos processos da Aços Vital',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#081437',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <body className={`${inter.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
