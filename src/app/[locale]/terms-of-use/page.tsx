import { getTranslations, setRequestLocale } from 'next-intl/server';
import { buildMetadata } from '@/lib/metadata';
import { getPathname } from '@/i18n/navigation';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
    const { locale } = await params;
    const path = getPathname({ locale, href: '/terms-of-use' });
    if (locale === 'fr') {
        return buildMetadata({
            title: 'Mentions légales',
            description: "Mentions légales de TrackHour. Service gratuit, données sous responsabilité de l'utilisateur.",
            path,
            locale,
            href: '/terms-of-use',
        });
    }
    return buildMetadata({
        title: 'Terms of Use',
        description: 'TrackHour terms of use. Free service, no warranties, data stored locally in your browser.',
        path,
        locale,
        href: '/terms-of-use',
    });
}

export default async function TermsOfUsePage({ params }: Props) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('TermsOfUse');

    const sections = [
        { title: t('acceptanceTitle'), text: t('acceptanceText') },
        { title: t('descriptionTitle'), text: t('descriptionText') },
        { title: t('dataTitle'), text: t('dataText') },
        { title: t('noWarrantiesTitle'), text: t('noWarrantiesText') },
        { title: t('liabilityTitle'), text: t('liabilityText') },
        { title: t('personalUseTitle'), text: t('personalUseText') },
        { title: t('changesTitle'), text: t('changesText') },
    ] as const;

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
                {t('title')}
            </h1>
            <p className="text-text/40 text-sm mb-10">{t('lastUpdated')}</p>

            <div className="space-y-8 sm:max-w-3/4">
                {sections.map(({ title, text }) => (
                    <section key={title}>
                        <h2 className="text-xl font-bold mb-3">{title}</h2>
                        <p className="text-text/70 leading-relaxed">{text}</p>
                    </section>
                ))}
                <section>
                    <h2 className="text-xl font-bold mb-3">{t('contactTitle')}</h2>
                    <p className="text-text/70 leading-relaxed">
                        {t.rich('contactText', {
                            email: (chunks) => (
                                <a href="mailto:contact@trackhour.app" className="underline hover:text-text transition-colors">
                                    {chunks}
                                </a>
                            ),
                        })}
                    </p>
                </section>
            </div>
        </div>
    );
}
