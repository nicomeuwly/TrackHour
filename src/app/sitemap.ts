import type { MetadataRoute } from 'next';

const BASE_URL = 'https://trackhour.app';

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        // EN pages (no prefix — default locale)
        { url: `${BASE_URL}/`, lastModified: '2025-04-01', changeFrequency: 'weekly', priority: 1.0 },
        { url: `${BASE_URL}/time-tracker`, lastModified: '2025-04-01', changeFrequency: 'monthly', priority: 0.8 },
        { url: `${BASE_URL}/guide`, lastModified: '2025-04-01', changeFrequency: 'monthly', priority: 0.6 },
        { url: `${BASE_URL}/guide/why-track-work-hours`, lastModified: '2025-04-01', changeFrequency: 'monthly', priority: 0.5 },
        { url: `${BASE_URL}/guide/daily-work-log`, lastModified: '2025-04-01', changeFrequency: 'monthly', priority: 0.5 },
        { url: `${BASE_URL}/guide/common-time-tracking-mistakes`, lastModified: '2025-04-01', changeFrequency: 'monthly', priority: 0.5 },
        { url: `${BASE_URL}/guide/tracking-hours-remote-work`, lastModified: '2025-04-01', changeFrequency: 'monthly', priority: 0.5 },
        { url: `${BASE_URL}/guide/calculate-overtime-hours`, lastModified: '2025-04-01', changeFrequency: 'monthly', priority: 0.5 },
        { url: `${BASE_URL}/privacy-policy`, lastModified: '2025-04-01', changeFrequency: 'yearly', priority: 0.4 },
        { url: `${BASE_URL}/terms-of-use`, lastModified: '2025-04-01', changeFrequency: 'yearly', priority: 0.4 },

        // FR pages
        { url: `${BASE_URL}/fr`, lastModified: '2025-04-01', changeFrequency: 'weekly', priority: 1.0 },
        { url: `${BASE_URL}/fr/pointeuse-en-ligne`, lastModified: '2025-04-01', changeFrequency: 'monthly', priority: 0.8 },
        { url: `${BASE_URL}/fr/guide`, lastModified: '2025-04-01', changeFrequency: 'monthly', priority: 0.6 },
        { url: `${BASE_URL}/fr/guide/pourquoi-suivre-ses-heures`, lastModified: '2025-04-01', changeFrequency: 'monthly', priority: 0.5 },
        { url: `${BASE_URL}/fr/guide/journal-de-travail-quotidien`, lastModified: '2025-04-01', changeFrequency: 'monthly', priority: 0.5 },
        { url: `${BASE_URL}/fr/guide/erreurs-frequentes-suivi-des-heures`, lastModified: '2025-04-01', changeFrequency: 'monthly', priority: 0.5 },
        { url: `${BASE_URL}/fr/guide/suivi-des-heures-en-teletravail`, lastModified: '2025-04-01', changeFrequency: 'monthly', priority: 0.5 },
        { url: `${BASE_URL}/fr/guide/calculer-les-heures-supplementaires`, lastModified: '2025-04-01', changeFrequency: 'monthly', priority: 0.5 },
        { url: `${BASE_URL}/fr/politique-de-confidentialite`, lastModified: '2025-04-01', changeFrequency: 'yearly', priority: 0.4 },
        { url: `${BASE_URL}/fr/mentions-legales`, lastModified: '2025-04-01', changeFrequency: 'yearly', priority: 0.4 },
    ];
}
