import { getTranslations, setRequestLocale } from 'next-intl/server';
import { buildMetadata } from '@/lib/metadata';
import { getPathname } from '@/i18n/navigation';
import AdSenseUnit from '@/components/ads/AdSenseUnit';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
    const { locale } = await params;
    const path = getPathname({ locale, href: '/time-tracker' });
    if (locale === 'fr') {
        return buildMetadata({
            title: 'Pointeuse en ligne gratuite | TrackHour',
            description: "Pointeuse en ligne gratuite sans inscription. Enregistrez vos heures de travail quotidiennes. Vos données restent privées dans votre navigateur.",
            path,
            locale,
        });
    }
    return buildMetadata({
        title: 'Free Time Tracker — No Account Required | TrackHour',
        description: 'Log your daily work hours with our free online time tracker. No sign-up required. Your data stays private in your browser.',
        path,
        locale,
    });
}

export default async function TimeTrackerPage({ params }: Props) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('TimeTracker');

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
            <div className="grid lg:grid-cols-[1fr_300px] gap-10">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
                        {t('title')}
                    </h1>
                    <p className="text-foreground/60 text-lg mb-10 max-w-2xl">
                        {t('intro')}
                    </p>

                    <div
                        id="time-tracker-app"
                        className="border-2 border-dashed border-foreground/20 rounded-xl p-12 text-center text-foreground/40 text-sm"
                    >
                        {t('comingSoon')}
                    </div>
                </div>

                {/* AdSense sidebar */}
                <aside className="hidden lg:block">
                    <AdSenseUnit slot="sidebar-tracker" format="rectangle" />
                    {/* AdSense sidebar */}
                </aside>
            </div>
        </div>
    );
}
