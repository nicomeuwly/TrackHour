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
            title: 'Pointeuse en ligne gratuite',
            description: "Pointeuse en ligne gratuite sans inscription. Enregistrez vos heures de travail quotidiennes. Vos données restent privées dans votre navigateur.",
            path,
            locale,
            href: '/time-tracker',
        });
    }
    return buildMetadata({
        title: 'Free Time Tracker — No Account Required',
        description: 'Log your daily work hours with our free online time tracker. No sign-up required. Your data stays private in your browser.',
        path,
        locale,
        href: '/time-tracker',
    });
}

export default async function TimeTrackerPage({ params }: Props) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('TimeTracker');

    return (
        // The tool comes first: it is what people open this page for every day.
        // The intro stays on the page for first-time visitors and search engines.
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight mb-4 sm:mb-8">
                {t('title')}
            </h1>
            <DashboardLoader />
            <p className="text-text/60 text-base mt-10 max-w-2xl">
                {t('intro')}
            </p>
        </div>
    );
}
