import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getPathname } from '@/i18n/navigation';
import { buildMetadata } from '@/lib/metadata';
import ArticleLayout from '@/components/guide/ArticleLayout';

type Props = { params: Promise<{ locale: string }> };

const HREF = '/guide/common-time-tracking-mistakes';
const NS = 'Guide.articles.mistakes';

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
        <ArticleLayout articleKey="mistakes" locale={locale}>
            <p className="text-text/70 leading-relaxed">{t('body')}</p>

            <section>
                <h2 className="text-2xl font-bold mb-4">{t('avoidTitle')}</h2>
                <ul className="space-y-2 text-text/70">
                    {(['avoid1', 'avoid2', 'avoid3'] as const).map(key => (
                        <li key={key} className="flex items-start gap-2">
                            <span className="text-text/30">→</span>
                            <span>{t(key)}</span>
                        </li>
                    ))}
                </ul>
            </section>
        </ArticleLayout>
    );
}
