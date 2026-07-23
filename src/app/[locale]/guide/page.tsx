import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { Link, getPathname } from '@/i18n/navigation';
import { buildMetadata } from '@/lib/metadata';
import { GUIDE_ARTICLES } from '@/content/guides';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
    const { locale } = await params;
    const path = getPathname({ locale, href: '/guide' });
    const t = await getTranslations({ locale, namespace: 'Guide' });
    return buildMetadata({
        title: locale === 'fr' ? 'Guide du suivi des heures de travail' : 'Work Hours Guide',
        description: t('intro'),
        path,
        locale,
        href: '/guide',
    });
}

export default async function GuideIndexPage({ params }: Props) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('Guide');

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <header className="mb-12 max-w-2xl">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">{t('title')}</h1>
                <p className="text-lg text-text/60 leading-relaxed">{t('intro')}</p>
            </header>

            <div className="grid gap-4 sm:grid-cols-2">
                {GUIDE_ARTICLES.map(a => (
                    <Link
                        key={a.key}
                        href={a.href}
                        className="group flex flex-col rounded-2xl border border-text/10 bg-background p-6 hover:border-text/25 hover:shadow-sm transition-all"
                    >
                        <h2 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                            {t(`articles.${a.key}.title`)}
                        </h2>
                        <p className="text-sm text-text/60 leading-relaxed flex-1">
                            {t(`articles.${a.key}.excerpt`)}
                        </p>
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary mt-4">
                            {t('readArticle')}
                            <ArrowRight size={15} aria-hidden className="group-hover:translate-x-0.5 transition-transform" />
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
