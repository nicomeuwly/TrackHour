import type { Metadata } from 'next';
import { getPathname } from '@/i18n/navigation';

const BASE_URL = 'https://trackhour.app';
const SITE_NAME = 'TrackHour';

type BuildMetadataParams = {
    title: string;
    description: string;
    path: string;
    locale: string;
    href: Parameters<typeof getPathname>[0]['href'];
};

export function buildMetadata({ title, description, path, locale, href }: BuildMetadataParams): Metadata {
    const url = `${BASE_URL}${path}`;
    const ogLocale = locale === 'fr' ? 'fr_FR' : 'en_US';

    const enPath = getPathname({ locale: 'en', href });
    const frPath = getPathname({ locale: 'fr', href });

    return {
        title,
        description,
        alternates: {
            canonical: url,
            languages: {
                'en': `${BASE_URL}${enPath}`,
                'fr': `${BASE_URL}${frPath}`,
                'x-default': `${BASE_URL}${enPath}`,
            },
        },
        openGraph: {
            title,
            description,
            url,
            siteName: SITE_NAME,
            locale: ogLocale,
            type: 'website',
        },
        twitter: {
            card: 'summary',
            title,
            description,
        },
        robots: {
            index: true,
            follow: true,
        },
    };
}
