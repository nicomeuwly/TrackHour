import { getTranslations, setRequestLocale } from 'next-intl/server';
import { buildMetadata } from '@/lib/metadata';
import { getPathname } from '@/i18n/navigation';
import DashboardLoader from '@/components/tracker/DashboardLoader';

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
    return [{ locale: 'en' }, { locale: 'fr' }];
}

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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <div className="flex flex-col gap-10">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                    {t('title')}
                </h1>
                <p className="text-foreground/60 text-base mb-8 max-w-2xl">
                    {t('intro')}
                </p>
                <DashboardLoader />
            </div>
        </div>
    );
}
