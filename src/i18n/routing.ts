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
        '/guide': {
            en: '/guide',
            fr: '/guide'
        },
        '/guide/why-track-work-hours': {
            en: '/guide/why-track-work-hours',
            fr: '/guide/pourquoi-suivre-ses-heures'
        },
        '/guide/daily-work-log': {
            en: '/guide/daily-work-log',
            fr: '/guide/journal-de-travail-quotidien'
        },
        '/guide/common-time-tracking-mistakes': {
            en: '/guide/common-time-tracking-mistakes',
            fr: '/guide/erreurs-frequentes-suivi-des-heures'
        },
        '/guide/tracking-hours-remote-work': {
            en: '/guide/tracking-hours-remote-work',
            fr: '/guide/suivi-des-heures-en-teletravail'
        },
        '/guide/calculate-overtime-hours': {
            en: '/guide/calculate-overtime-hours',
            fr: '/guide/calculer-les-heures-supplementaires'
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
