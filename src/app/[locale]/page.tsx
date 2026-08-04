import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link, getPathname } from '@/i18n/navigation';
import { buildMetadata } from '@/lib/metadata';
import { SITE_URL, SITE_NAME } from '@/lib/site';
import JsonLd from '@/components/JsonLd';

export function generateStaticParams() {
    return [{ locale: 'en' }, { locale: 'fr' }];
}

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
    const { locale } = await params;
    const path = getPathname({ locale, href: '/' });
    if (locale === 'fr') {
        return buildMetadata({
            title: 'Suivi des heures de travail gratuit',
            description: "Suivez vos heures de travail quotidiennes gratuitement. Sans compte, vos données restent dans votre navigateur. Simple, privé, toujours disponible.",
            path,
            locale,
            href: '/',
        });
    }
    return buildMetadata({
        title: 'Free Online Work Hours Tracker',
        description: 'Track your daily work hours for free. No account needed, your data stays in your browser. Simple, private, and always available.',
        path,
        locale,
        href: '/',
    });
}

export default async function HomePage({ params }: Props) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('HomePage');

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
            <JsonLd
                data={{
                    '@context': 'https://schema.org',
                    '@type': 'SoftwareApplication',
                    name: SITE_NAME,
                    applicationCategory: 'BusinessApplication',
                    operatingSystem: 'Web',
                    url: SITE_URL,
                    description: t('subtitle'),
                    inLanguage: locale,
                    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
                }}
            />

            {/* Hero */}
            <section className="text-center mb-20">
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 leading-tight">
                    {t('title')}
                </h1>
                <p className="text-lg sm:text-xl text-text/60 max-w-2xl mx-auto mb-10">
                    {t('subtitle')}
                </p>
                <Link
                    href="/time-tracker"
                    className="inline-block bg-text text-background px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                    {t('ctaButton')}
                </Link>
                <picture className="dark:hidden">
                    <source media="(max-width: 640px)" srcSet={`/hero-image-light-${locale}-mobile.webp`} />
                    <img src={`/hero-image-light-${locale}.webp`} alt="Hero Image" className="mx-auto mt-10" />
                </picture>
                <picture className="hidden dark:block">
                    <source media="(max-width: 640px)" srcSet={`/hero-image-dark-${locale}-mobile.webp`} />
                    <img src={`/hero-image-dark-${locale}.webp`} alt="Hero Image" className="mx-auto mt-10" />
                </picture>
            </section>

            {/* How it works */}
            <section className="mb-20">
                <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
                    {t('howItWorksTitle')}
                </h2>
                <div className="grid sm:grid-cols-3 gap-8">
                    {[
                        { num: '1', title: t('step1Title'), desc: t('step1Desc') },
                        { num: '2', title: t('step2Title'), desc: t('step2Desc') },
                        { num: '3', title: t('step3Title'), desc: t('step3Desc') },
                    ].map(({ num, title, desc }) => (
                        <div key={num} className="text-center">
                            <div className="w-12 h-12 rounded-full bg-text text-background flex items-center justify-center text-lg font-bold mx-auto mb-4">
                                {num}
                            </div>
                            <h3 className="font-semibold text-lg mb-2">{title}</h3>
                            <p className="text-text/60">{desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Who uses TrackHour */}
            <section className="mb-20">
                <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
                    {t('usersTitle')}
                </h2>
                <div className="grid sm:grid-cols-3 gap-6">
                    {[
                        { title: t('user1Title'), desc: t('user1Desc') },
                        { title: t('user2Title'), desc: t('user2Desc') },
                        { title: t('user3Title'), desc: t('user3Desc') },
                    ].map(({ title, desc }) => (
                        <div key={title} className="border border-text/10 rounded-xl p-6 bg-background">
                            <h3 className="font-semibold text-lg mb-2">{title}</h3>
                            <p className="text-text/60 text-sm leading-relaxed">{desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Why TrackHour */}
            <section className="mb-20">
                <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
                    {t('whyTitle')}
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { title: t('feature1Title'), desc: t('feature1Desc') },
                        { title: t('feature2Title'), desc: t('feature2Desc') },
                        { title: t('feature3Title'), desc: t('feature3Desc') },
                        { title: t('feature4Title'), desc: t('feature4Desc') },
                    ].map(({ title, desc }) => (
                        <div key={title} className="border border-text/10 rounded-xl p-6 bg-background">
                            <h3 className="font-semibold text-lg mb-2">{title}</h3>
                            <p className="text-text/60 text-sm">{desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* FAQ */}
            <section>
                <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
                    {t('faqTitle')}
                </h2>
                <div className="max-w-3xl mx-auto space-y-6">
                    {(['1', '2', '3', '4'] as const).map((n) => (
                        <div key={n} className="border border-text/10 rounded-xl p-6 bg-background">
                            <h3 className="font-semibold text-base mb-2">{t(`faq${n}Q`)}</h3>
                            <p className="text-text/60 text-sm leading-relaxed">{t(`faq${n}A`)}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
