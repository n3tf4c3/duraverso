import { IBM_Plex_Mono, IBM_Plex_Sans, Source_Serif_4 } from 'next/font/google';
const serif = Source_Serif_4({ subsets: ['latin'], weight: ['600'], variable: '--font-source-serif', display: 'swap' });
const sans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-sans',
  display: 'swap',
});
const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
});
export const fontClasses = `${serif.variable} ${sans.variable} ${mono.variable}`;
