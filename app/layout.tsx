import type {Metadata} from 'next';
import { DM_Sans, Space_Mono, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Providers } from './Providers';
import { AppLayout } from '../components/AppLayout';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
});

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-mono',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
});

export const metadata: Metadata = {
  title: 'Klub Studio App',
  description: 'Trade with intention.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${spaceMono.variable} ${playfair.variable}`}>
      <body suppressHydrationWarning className="font-sans antialiased text-white">
        <Providers>
          <AppLayout>
            {children}
          </AppLayout>
        </Providers>
      </body>
    </html>
  );
}
