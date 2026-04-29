import { getTranslations, setRequestLocale } from 'next-intl/server';
import { buildMetadata } from '@/lib/metadata';
import { getPathname } from '@/i18n/navigation';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
    const { locale } = await params;
    const path = getPathname({ locale, href: '/work-hours-calculator' });
    if (locale === 'fr') {
        return buildMetadata({
            title: 'Calcul heures travaillées gratuit | TrackHour',
            description: "Calculez vos heures travaillées par jour ou par semaine. Outil gratuit en ligne, sans compte requis.",
            path,
            locale,
        });
    }
    return buildMetadata({
        title: 'Work Hours Calculator — Free Online Tool | TrackHour',
        description: 'Calculate your total hours worked per day or week. Free online work hours calculator, no account needed.',
        path,
        locale,
    });
}

export default async function CalculatorPage({ params }: Props) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('Calculator');

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
                {t('title')}
            </h1>
            <p className="text-foreground/60 text-lg mb-10 max-w-2xl">
                {t('intro')}
            </p>

            <div
                id="calculator"
                className="border-2 border-dashed border-foreground/20 rounded-xl p-12 text-center text-foreground/40 text-sm"
            >
                {t('comingSoon')}
            </div>
        </div>
    );
}
