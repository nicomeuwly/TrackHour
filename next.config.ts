import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.trackhour.app' }],
        destination: 'https://trackhour.app/:path*',
        permanent: true,
      },
      // Old guide pages moved under the /guide hub
      { source: '/how-to-track-work-hours', destination: '/guide/daily-work-log', permanent: true },
      { source: '/fr/comment-suivre-ses-heures-de-travail', destination: '/fr/guide/journal-de-travail-quotidien', permanent: true },
      { source: '/overtime-guide', destination: '/guide/calculate-overtime-hours', permanent: true },
      { source: '/fr/guide-heures-supplementaires', destination: '/fr/guide/calculer-les-heures-supplementaires', permanent: true },
      // Legacy content URL indexed by Google (worked-hours calculation)
      { source: '/fr/calcul-heures-travaillees', destination: '/fr/guide/journal-de-travail-quotidien', permanent: true },
    ];
  },
};

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
export default withNextIntl(nextConfig);
