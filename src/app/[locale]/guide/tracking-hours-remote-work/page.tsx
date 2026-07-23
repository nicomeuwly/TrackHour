import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getPathname } from '@/i18n/navigation';
import { buildMetadata } from '@/lib/metadata';
import ArticleLayout from '@/components/guide/ArticleLayout';

type Props = { params: Promise<{ locale: string }> };

const HREF = '/guide/tracking-hours-remote-work';
const NS = 'Guide.articles.remote';

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
        <ArticleLayout articleKey="remote" locale={locale}>
            <p className="text-text/70 leading-relaxed">{t('body')}</p>

            <section>
                <h2 className="text-2xl font-bold mb-4">{t('routineTitle')}</h2>
                <p className="text-text/70 leading-relaxed">{t('routineText')}</p>
            </section>
        </ArticleLayout>
    );
}
