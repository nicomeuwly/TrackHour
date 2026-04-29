import type { MetadataRoute } from 'next';

const BASE_URL = 'https://trackhour.app';
const NOW = new Date().toISOString();

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        // EN pages (no prefix — default locale)
        { url: `${BASE_URL}/`, lastModified: NOW, changeFrequency: 'weekly', priority: 1.0 },
        { url: `${BASE_URL}/time-tracker`, lastModified: NOW, changeFrequency: 'monthly', priority: 0.8 },
        { url: `${BASE_URL}/work-hours-calculator`, lastModified: NOW, changeFrequency: 'monthly', priority: 0.8 },
        { url: `${BASE_URL}/how-to-track-work-hours`, lastModified: NOW, changeFrequency: 'monthly', priority: 0.6 },
        { url: `${BASE_URL}/privacy-policy`, lastModified: NOW, changeFrequency: 'yearly', priority: 0.4 },
        { url: `${BASE_URL}/terms-of-use`, lastModified: NOW, changeFrequency: 'yearly', priority: 0.4 },

        // FR pages
        { url: `${BASE_URL}/fr`, lastModified: NOW, changeFrequency: 'weekly', priority: 1.0 },
        { url: `${BASE_URL}/fr/pointeuse-en-ligne`, lastModified: NOW, changeFrequency: 'monthly', priority: 0.8 },
        { url: `${BASE_URL}/fr/calcul-heures-travaillees`, lastModified: NOW, changeFrequency: 'monthly', priority: 0.8 },
        { url: `${BASE_URL}/fr/comment-suivre-ses-heures-de-travail`, lastModified: NOW, changeFrequency: 'monthly', priority: 0.6 },
        { url: `${BASE_URL}/fr/politique-de-confidentialite`, lastModified: NOW, changeFrequency: 'yearly', priority: 0.4 },
        { url: `${BASE_URL}/fr/mentions-legales`, lastModified: NOW, changeFrequency: 'yearly', priority: 0.4 },
    ];
}
