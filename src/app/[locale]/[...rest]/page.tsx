import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

type Props = { params: Promise<{ locale: string; rest: string[] }> };

// Catches any unmatched path under a locale so it renders the localized
// not-found page with a proper 404 status (next-intl recommended pattern).
export default async function CatchAllPage({ params }: Props) {
    const { locale } = await params;
    setRequestLocale(locale);
    notFound();
}
