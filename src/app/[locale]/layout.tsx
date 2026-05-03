import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AdSidebar from '@/components/ads/AdSidebar';
import '../globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'TrackHour',
    template: '%s | TrackHour',
  },
  description: 'Free online work hours tracker. No account needed, your data stays private.',
};

export function generateStaticParams() {
  return routing.locales.map((locale: string) => ({ locale }));
}

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

export default async function RootLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <html lang={locale} className={inter.variable}>
      <head>
        <meta name="google-adsense-account" content="ca-pub-2897114925732533"></meta>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2897114925732533"
          crossOrigin="anonymous"></script>
      </head>
      <body className="min-h-screen flex flex-col" suppressHydrationWarning>
        <NextIntlClientProvider>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <AdSidebar />
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
