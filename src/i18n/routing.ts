import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
    locales: ['en', 'fr'],
    defaultLocale: 'en',
    localePrefix: 'as-needed',
    pathnames: {
        '/': '/',
        '/time-tracker': {
            en: '/time-tracker',
            fr: '/pointeuse-en-ligne'
        },
        '/stats': {
            en: '/stats',
            fr: '/statistiques'
        },
        '/how-to-track-work-hours': {
            en: '/how-to-track-work-hours',
            fr: '/comment-suivre-ses-heures-de-travail'
        },
        '/privacy-policy': {
            en: '/privacy-policy',
            fr: '/politique-de-confidentialite'
        },
        '/terms-of-use': {
            en: '/terms-of-use',
            fr: '/mentions-legales'
        }
    }
});
