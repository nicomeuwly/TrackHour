import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        id: '/',
        name: 'TrackHour',
        short_name: 'TrackHour',
        description: 'Free online work hours tracker. No account needed, your data stays private in your browser.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        lang: 'en',
        dir: 'ltr',
        categories: ['productivity', 'utilities'],
        prefer_related_applications: false,
        icons: [
            {
                src: '/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any',
            },
            {
                src: '/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
        ],
        shortcuts: [
            {
                name: 'Track Hours',
                short_name: 'Clock',
                description: 'Log your work hours for today',
                url: '/time-tracker',
                icons: [{ src: '/icon-192.png', sizes: '192x192' }],
            },
            {
                name: 'View Statistics',
                short_name: 'Stats',
                description: 'View your weekly and monthly overview',
                url: '/stats',
                icons: [{ src: '/icon-192.png', sizes: '192x192' }],
            },
        ],
    };
}
