import type {Metadata} from 'next';
import { IBM_Plex_Sans, IBM_Plex_Sans_Condensed } from 'next/font/google';
import './globals.css';
import { Providers } from './Providers';
import { AppLayout } from '../components/AppLayout';

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
});

const ibmPlexSansCondensed = IBM_Plex_Sans_Condensed({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: '(Klub.) - Autonomous Liquidity',
  description: 'Trade with intention.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${ibmPlexSans.variable} ${ibmPlexSansCondensed.variable}`}>
      <body suppressHydrationWarning className="font-sans antialiased text-[#FFFEEF]">
        <Providers>
          <AppLayout>
            {children}
          </AppLayout>
        </Providers>
      </body>
    </html>
  );
}
