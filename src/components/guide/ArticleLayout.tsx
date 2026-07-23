import { getTranslations } from 'next-intl/server';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link, getPathname } from '@/i18n/navigation';
import { GUIDE_ARTICLES, getArticle, type GuideKey } from '@/content/guides';
import { SITE_URL, SITE_NAME } from '@/lib/site';
import JsonLd from '@/components/JsonLd';

interface ArticleLayoutProps {
  articleKey: GuideKey;
  locale: string;
  children: React.ReactNode;
}

export default async function ArticleLayout({ articleKey, locale, children }: ArticleLayoutProps) {
  const t = await getTranslations('Guide');
  const article = getArticle(articleKey);
  const related = GUIDE_ARTICLES.filter(a => a.key !== articleKey);

  const title = t(`articles.${articleKey}.title`);
  const excerpt = t(`articles.${articleKey}.excerpt`);
  const articleUrl = SITE_URL + getPathname({ locale, href: article.href });
  const publisher = {
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon-512.png` },
  };

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description: excerpt,
      inLanguage: locale,
      datePublished: article.date,
      dateModified: article.date,
      mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl },
      author: publisher,
      publisher,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: SITE_NAME, item: SITE_URL + getPathname({ locale, href: '/' }) },
        { '@type': 'ListItem', position: 2, name: t('title'), item: SITE_URL + getPathname({ locale, href: '/guide' }) },
        { '@type': 'ListItem', position: 3, name: title, item: articleUrl },
      ],
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <JsonLd data={jsonLd} />

      <div className="max-w-3xl">
        <Link
          href="/guide"
          className="inline-flex items-center gap-1.5 text-sm text-text/50 hover:text-text transition-colors mb-8"
        >
          <ArrowLeft size={14} aria-hidden />
          {t('backToGuide')}
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">{title}</h1>
        <p className="text-lg text-text/60 mb-10 leading-relaxed">{excerpt}</p>

        <article className="prose prose-neutral space-y-10">{children}</article>

        <div className="mt-12 pt-8 border-t border-text/10">
          <Link
            href="/time-tracker"
            className="inline-flex items-center gap-2 bg-text text-background px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            {t('ctaText')}
            <ArrowRight size={18} aria-hidden />
          </Link>
        </div>

        <div className="mt-14">
          <h2 className="text-sm font-semibold text-text/50 uppercase tracking-wide mb-4">{t('relatedTitle')}</h2>
          <ul className="flex flex-col divide-y divide-text/8 border-y border-text/8">
            {related.map(a => (
              <li key={a.key}>
                <Link
                  href={a.href}
                  className="group flex items-center justify-between gap-4 py-3.5 hover:text-primary transition-colors"
                >
                  <span className="font-medium">{t(`articles.${a.key}.title`)}</span>
                  <ArrowRight size={16} aria-hidden className="flex-none text-text/30 group-hover:text-primary transition-colors" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
