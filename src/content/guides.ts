/**
 * Registry of guide articles. Adding an article = one entry here, a matching
 * folder under `app/[locale]/guide/<slug>/`, and its content under the
 * `Guide.articles.<key>` message namespace.
 *
 * `key`  — message key under `Guide.articles`.
 * `href` — next-intl pathname (must exist in `routing.pathnames`).
 * `date` — publication date (ISO), used for Article structured data.
 */
export const GUIDE_ARTICLES = [
  { key: 'whyTrack', href: '/guide/why-track-work-hours', date: '2026-07-20' },
  { key: 'dailyLog', href: '/guide/daily-work-log', date: '2026-07-20' },
  { key: 'mistakes', href: '/guide/common-time-tracking-mistakes', date: '2026-07-20' },
  { key: 'remote', href: '/guide/tracking-hours-remote-work', date: '2026-07-20' },
  { key: 'overtime', href: '/guide/calculate-overtime-hours', date: '2026-07-20' },
] as const;

export type GuideKey = (typeof GUIDE_ARTICLES)[number]['key'];
export type GuideHref = (typeof GUIDE_ARTICLES)[number]['href'];

export function getArticle(key: GuideKey) {
  return GUIDE_ARTICLES.find(a => a.key === key)!;
}
