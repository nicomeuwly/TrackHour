import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function Footer() {
    const t = await getTranslations('Footer');

    return (
        <footer className="mt-auto bg-background border-t border-foreground/10">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-foreground/50">
                <p>{t('copyright')}</p>
                <nav className="flex items-center gap-4">
                    <Link href="/privacy-policy" className="hover:text-foreground/80 transition-colors">
                        {t('privacyPolicy')}
                    </Link>
                    <Link href="/terms-of-use" className="hover:text-foreground/80 transition-colors">
                        {t('termsOfUse')}
                    </Link>
                </nav>
            </div>
        </footer>
    );
}
