import type { Metadata } from 'next';

const BASE_URL = 'https://trackhour.app';
const SITE_NAME = 'TrackHour';

type BuildMetadataParams = {
    title: string;
    description: string;
    path: string;
    locale: string;
};

export function buildMetadata({ title, description, path, locale }: BuildMetadataParams): Metadata {
    const url = `${BASE_URL}${path}`;
    const ogLocale = locale === 'fr' ? 'fr_FR' : 'en_US';

    return {
        title,
        description,
        alternates: {
            canonical: url,
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
