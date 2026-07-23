import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getPathname } from '@/i18n/navigation';
import { buildMetadata } from '@/lib/metadata';
import ArticleLayout from '@/components/guide/ArticleLayout';

type Props = { params: Promise<{ locale: string }> };

const HREF = '/guide/calculate-overtime-hours';
const NS = 'Guide.articles.overtime';

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

    const sections = ['whatIs', 'dailyVsWeekly', 'pay', 'records', 'using'] as const;

    return (
        <ArticleLayout articleKey="overtime" locale={locale}>
            <p className="text-text/70 leading-relaxed">{t('intro')}</p>

            {sections.map(key => (
                <section key={key}>
                    <h2 className="text-2xl font-bold mb-4">{t(`${key}Title`)}</h2>
                    <p className="text-text/70 leading-relaxed">{t(`${key}Text`)}</p>
                </section>
            ))}

            <section>
                <h2 className="text-2xl font-bold mb-4">{t('faqTitle')}</h2>
                <div className="space-y-6">
                    {(['1', '2', '3'] as const).map(n => (
                        <div key={n}>
                            <h3 className="font-semibold text-base mb-2">{t(`faq${n}Q`)}</h3>
                            <p className="text-text/70 leading-relaxed">{t(`faq${n}A`)}</p>
                        </div>
                    ))}
                </div>
            </section>
        </ArticleLayout>
    );
}
