import { getTranslations, setRequestLocale } from 'next-intl/server';
import { buildMetadata } from '@/lib/metadata';
import { getPathname } from '@/i18n/navigation';
import DataTabLoader from '@/components/tracker/DataTabLoader';
import AdSenseUnit from '@/components/ads/AdSenseUnit';

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
    return [{ locale: 'en' }, { locale: 'fr' }];
}

export async function generateMetadata({ params }: Props) {
    const { locale } = await params;
    const path = getPathname({ locale, href: '/stats' });
    if (locale === 'fr') {
        return buildMetadata({
            title: 'Statistiques des heures de travail | TrackHour',
            description: "Consultez vos heures de travail par semaine ou par mois, suivez votre solde d'heures supplémentaires et gérez vos données. Gratuit et privé.",
            path,
            locale,
        });
    }
    return buildMetadata({
        title: 'Work Hours Statistics — Weekly & Monthly Overview | TrackHour',
        description: 'View your work hours by week or month, track your overtime balance, and manage your data. Free and private — no account needed.',
        path,
        locale,
    });
}

export default async function StatsPage({ params }: Props) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('Stats');

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                {t('title')}
            </h1>
            <p className="text-foreground/60 text-base mb-8 max-w-2xl">
                {t('intro')}
            </p>
            <div className="my-6 flex justify-center">
                <AdSenseUnit slot="mid-stats" format="horizontal" className="w-full max-w-2xl" />
            </div>
            <DataTabLoader />
        </div>
    );
}
