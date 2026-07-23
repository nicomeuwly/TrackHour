import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function NotFound() {
    const t = await getTranslations('NotFound');

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
            <p className="text-7xl sm:text-8xl font-bold text-text/12 tracking-tight mb-4">404</p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">{t('title')}</h1>
            <p className="text-text/60 mb-10 leading-relaxed">{t('description')}</p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                    href="/"
                    className="inline-block bg-text text-background px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                    {t('home')}
                </Link>
                <Link
                    href="/time-tracker"
                    className="inline-block px-6 py-3 rounded-lg font-semibold border border-text/20 hover:border-text/40 transition-colors"
                >
                    {t('tracker')}
                </Link>
                <Link
                    href="/guide"
                    className="inline-block px-6 py-3 rounded-lg font-semibold border border-text/20 hover:border-text/40 transition-colors"
                >
                    {t('guide')}
                </Link>
            </div>
        </div>
    );
}
