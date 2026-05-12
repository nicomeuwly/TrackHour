'use client';

import { useRouter, usePathname } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { routing } from '@/i18n/routing';

type AppPathname = keyof typeof routing.pathnames;

export default function LocaleSwitcher() {
    const locale = useLocale();
    const pathname = usePathname();
    const router = useRouter();

    const switchLocale = (next: string) => {
        router.replace(pathname as AppPathname, { locale: next });
    };

    return (
        <div className="flex items-center gap-1 text-sm font-medium">
            <button
                onClick={() => switchLocale('en')}
                className={locale === 'en' ? 'text-text' : 'text-text/40 hover:text-text/70 transition-colors'}
                aria-label="Switch to English"
            >
                EN
            </button>
            <span className="text-text/20">|</span>
            <button
                onClick={() => switchLocale('fr')}
                className={locale === 'fr' ? 'text-text' : 'text-text/40 hover:text-text/70 transition-colors'}
                aria-label="Passer en français"
            >
                FR
            </button>
        </div>
    );
}
