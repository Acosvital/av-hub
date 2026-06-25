import type { Metadata, Viewport } from 'next';
import { Fira_Sans } from 'next/font/google';
import '@/styles/globals.css';
import Providers from '@/providers';

const firaSans = Fira_Sans({
  variable: '--font-fira-sans',
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
      <body className={`${firaSans.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
