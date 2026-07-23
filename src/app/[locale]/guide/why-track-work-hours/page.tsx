import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getPathname } from '@/i18n/navigation';
import { buildMetadata } from '@/lib/metadata';
import ArticleLayout from '@/components/guide/ArticleLayout';

type Props = { params: Promise<{ locale: string }> };

const HREF = '/guide/why-track-work-hours';
const NS = 'Guide.articles.whyTrack';

export async function generateMetadata({ params }: Props) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: NS });
    return buildMetadata({
        title: t('title'),
        description: t('excerpt'),
        path: getPathname({ locale, href: HREF }),
        locale,
        href: HREF,
    });
}

export default async function Page({ params }: Props) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations(NS);

    return (
        <ArticleLayout articleKey="whyTrack" locale={locale}>
            <p className="text-text/70 leading-relaxed">{t('body')}</p>

            <section>
                <h2 className="text-2xl font-bold mb-4">{t('disputesTitle')}</h2>
                <p className="text-text/70 leading-relaxed">{t('disputesText')}</p>
            </section>

            <section>
                <h2 className="text-2xl font-bold mb-4">{t('startTitle')}</h2>
                <p className="text-text/70 leading-relaxed">{t('startText')}</p>
            </section>
        </ArticleLayout>
    );
}
