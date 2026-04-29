import { getTranslations, setRequestLocale } from 'next-intl/server';
import { buildMetadata } from '@/lib/metadata';
import { getPathname } from '@/i18n/navigation';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
    const { locale } = await params;
    const path = getPathname({ locale, href: '/privacy-policy' });
    if (locale === 'fr') {
        return buildMetadata({
            title: 'Politique de confidentialité | TrackHour',
            description: 'Politique de confidentialité de TrackHour. Aucune donnée collectée côté serveur. Vos heures restent dans votre navigateur.',
            path,
            locale,
        });
    }
    return buildMetadata({
        title: 'Privacy Policy | TrackHour',
        description: 'TrackHour privacy policy. No data collected on our servers. Your work hours stay in your browser.',
        path,
        locale,
    });
}

export default async function PrivacyPolicyPage({ params }: Props) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('PrivacyPolicy');

    const sections = [
        { title: t('dataTitle'), text: t('dataText') },
        { title: t('adsenseTitle'), text: t('adsenseText') },
        { title: t('analyticsTitle'), text: t('analyticsText') },
        { title: t('cookiesTitle'), text: t('cookiesText') },
        { title: t('rightsTitle'), text: t('rightsText') },
        { title: t('changesTitle'), text: t('changesText') },
        { title: t('contactTitle'), text: t('contactText') },
    ] as const;

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
                {t('title')}
            </h1>
            <p className="text-foreground/40 text-sm mb-10">{t('lastUpdated')}</p>

            <p className="text-foreground/70 mb-10 leading-relaxed sm:max-w-3/4">{t('intro')}</p>

            <div className="space-y-8 sm:max-w-3/4">
                {sections.map(({ title, text }) => (
                    <section key={title}>
                        <h2 className="text-xl font-bold mb-3">{title}</h2>
                        <p className="text-foreground/70 leading-relaxed">{text}</p>
                    </section>
                ))}
            </div>
        </div>
    );
}
