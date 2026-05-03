import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link, getPathname } from '@/i18n/navigation';
import { buildMetadata } from '@/lib/metadata';
import AdSenseUnit from '@/components/ads/AdSenseUnit';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
    const { locale } = await params;
    const path = getPathname({ locale, href: '/how-to-track-work-hours' });
    if (locale === 'fr') {
        return buildMetadata({
            title: 'Comment suivre ses heures de travail | Guide TrackHour',
            description: "Apprenez à suivre vos heures de travail facilement. Méthodes, conseils et outil gratuit pour enregistrer vos heures quotidiennes.",
            path,
            locale,
            href: '/how-to-track-work-hours',
        });
    }
    return buildMetadata({
        title: 'How to Track Work Hours Effectively | TrackHour Guide',
        description: 'Learn how to track your work hours easily and accurately. Tips, methods, and a free tool to log your daily hours online.',
        path,
        locale,
        href: '/how-to-track-work-hours',
    });
}

export default async function GuidePage({ params }: Props) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('Guide');

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-10">
                {t('title')}
            </h1>

            <article className="prose prose-neutral sm:max-w-3/4 space-y-10">
                <section>
                    <h2 className="text-2xl font-bold mb-4">{t('whyMattersTitle')}</h2>
                    <p className="text-foreground/70 leading-relaxed">{t('whyMattersText')}</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">{t('dailyLogTitle')}</h2>
                    <p className="text-foreground/70 leading-relaxed">{t('dailyLogText')}</p>
                </section>

                <div className="flex justify-center">
                    <AdSenseUnit slot="mid-guide" format="horizontal" className="w-full max-w-2xl" />
                </div>

                <section>
                    <h2 className="text-2xl font-bold mb-4">{t('whatToRecordTitle')}</h2>
                    <ul className="space-y-2 text-foreground/70">
                        {(['whatToRecord1', 'whatToRecord2', 'whatToRecord3', 'whatToRecord4'] as const).map((key) => (
                            <li key={key} className="flex items-start gap-2">
                                <span className="text-foreground/30">→</span>
                                <span>{t(key)}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">{t('overtimeTitle')}</h2>
                    <p className="text-foreground/70 leading-relaxed">{t('overtimeText')}</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">{t('usingTrackHourTitle')}</h2>
                    <p className="text-foreground/70 leading-relaxed">{t('usingTrackHourText')}</p>
                </section>
            </article>

            <div className="mt-12 pt-8 border-t border-foreground/10">
                <Link
                    href="/time-tracker"
                    className="inline-block bg-foreground text-background px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                    {t('ctaText')} →
                </Link>
            </div>
        </div>
    );
}
