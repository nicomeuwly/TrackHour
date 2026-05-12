import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link, getPathname } from '@/i18n/navigation';
import { buildMetadata } from '@/lib/metadata';
import AdSenseUnit from '@/components/ads/AdSenseUnit';

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
    return [{ locale: 'en' }, { locale: 'fr' }];
}

export async function generateMetadata({ params }: Props) {
    const { locale } = await params;
    const path = getPathname({ locale, href: '/overtime-guide' });
    if (locale === 'fr') {
        return buildMetadata({
            title: 'Comment calculer ses heures supplémentaires | Guide',
            description: "Guide complet pour calculer vos heures supplémentaires : méthodes, droits, et outil gratuit pour suivre votre solde automatiquement.",
            path,
            locale,
            href: '/overtime-guide',
        });
    }
    return buildMetadata({
        title: 'How to Calculate Overtime Hours | Guide',
        description: 'Complete guide to calculating overtime hours: methods, rights, and a free tool to track your balance automatically.',
        path,
        locale,
        href: '/overtime-guide',
    });
}

export default async function OvertimeGuidePage({ params }: Props) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('OvertimeGuide');

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                {t('title')}
            </h1>
            <p className="text-text/60 mb-10 leading-relaxed sm:max-w-3/4">
                {t('intro')}
            </p>

            <article className="prose prose-neutral sm:max-w-3/4 space-y-10">
                <section>
                    <h2 className="text-2xl font-bold mb-4">{t('whatIsTitle')}</h2>
                    <p className="text-text/70 leading-relaxed">{t('whatIsText')}</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">{t('dailyVsWeeklyTitle')}</h2>
                    <p className="text-text/70 leading-relaxed">{t('dailyVsWeeklyText')}</p>
                </section>

                <div className="flex justify-center">
                    <AdSenseUnit slot="mid-overtime" format="horizontal" className="w-full max-w-2xl" />
                </div>

                <section>
                    <h2 className="text-2xl font-bold mb-4">{t('payTitle')}</h2>
                    <p className="text-text/70 leading-relaxed">{t('payText')}</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">{t('recordsTitle')}</h2>
                    <p className="text-text/70 leading-relaxed">{t('recordsText')}</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">{t('usingTrackHourTitle')}</h2>
                    <p className="text-text/70 leading-relaxed">{t('usingTrackHourText')}</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">{t('faqTitle')}</h2>
                    <div className="space-y-6">
                        {(['1', '2', '3'] as const).map((n) => (
                            <div key={n}>
                                <h3 className="font-semibold text-base mb-2">{t(`faq${n}Q` as const)}</h3>
                                <p className="text-text/70 leading-relaxed">{t(`faq${n}A` as const)}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </article>

            <div className="mt-12 pt-8 border-t border-text/10 flex flex-col sm:flex-row gap-4">
                <Link
                    href="/time-tracker"
                    className="inline-block bg-text text-background px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                    {t('ctaText')} →
                </Link>
                <Link
                    href="/how-to-track-work-hours"
                    className="inline-block px-8 py-3 rounded-lg font-semibold border border-text/20 hover:border-text/40 transition-colors"
                >
                    ← {t('backToGuide')}
                </Link>
            </div>
        </div>
    );
}
