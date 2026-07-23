import type { MetadataRoute } from 'next';

const BASE_URL = 'https://trackhour.app';
const LAST_MODIFIED = '2026-07-23';

type ChangeFrequency = MetadataRoute.Sitemap[number]['changeFrequency'];

// Each page as an [en path, fr path] pair so both locales are emitted with
// reciprocal hreflang alternates (helps Google index both language versions).
const PAGES: { en: string; fr: string; priority: number; changeFrequency: ChangeFrequency }[] = [
    { en: '/', fr: '/fr', priority: 1.0, changeFrequency: 'weekly' },
    { en: '/time-tracker', fr: '/fr/pointeuse-en-ligne', priority: 0.8, changeFrequency: 'monthly' },
    { en: '/stats', fr: '/fr/statistiques', priority: 0.6, changeFrequency: 'monthly' },
    { en: '/guide', fr: '/fr/guide', priority: 0.6, changeFrequency: 'monthly' },
    { en: '/guide/why-track-work-hours', fr: '/fr/guide/pourquoi-suivre-ses-heures', priority: 0.5, changeFrequency: 'monthly' },
    { en: '/guide/daily-work-log', fr: '/fr/guide/journal-de-travail-quotidien', priority: 0.5, changeFrequency: 'monthly' },
    { en: '/guide/common-time-tracking-mistakes', fr: '/fr/guide/erreurs-frequentes-suivi-des-heures', priority: 0.5, changeFrequency: 'monthly' },
    { en: '/guide/tracking-hours-remote-work', fr: '/fr/guide/suivi-des-heures-en-teletravail', priority: 0.5, changeFrequency: 'monthly' },
    { en: '/guide/calculate-overtime-hours', fr: '/fr/guide/calculer-les-heures-supplementaires', priority: 0.5, changeFrequency: 'monthly' },
    { en: '/privacy-policy', fr: '/fr/politique-de-confidentialite', priority: 0.4, changeFrequency: 'yearly' },
    { en: '/terms-of-use', fr: '/fr/mentions-legales', priority: 0.4, changeFrequency: 'yearly' },
];

export default function sitemap(): MetadataRoute.Sitemap {
    const entries: MetadataRoute.Sitemap = [];

    for (const page of PAGES) {
        const enUrl = `${BASE_URL}${page.en}`;
        const frUrl = `${BASE_URL}${page.fr}`;
        const languages = { en: enUrl, fr: frUrl, 'x-default': enUrl };
        const common = {
            lastModified: LAST_MODIFIED,
            changeFrequency: page.changeFrequency,
            priority: page.priority,
            alternates: { languages },
        };
        entries.push({ url: enUrl, ...common });
        entries.push({ url: frUrl, ...common });
    }

    return entries;
}
