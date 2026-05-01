import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import LocaleSwitcher from './LocaleSwitcher';
import MobileNav from './MobileNav';

export default async function Header() {
    const t = await getTranslations('Header');

    return (
        <header className="relative border-b border-foreground/10">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                <Link href="/" className="text-xl font-bold tracking-tight hover:opacity-80 transition-opacity">
                    TrackHour
                </Link>

                <nav className="hidden sm:flex items-center gap-6 text-sm">
                    <Link href="/" className="hover:opacity-70 transition-opacity">
                        {t('home')}
                    </Link>
                    <Link href="/time-tracker" className="hover:opacity-70 transition-opacity">
                        {t('timeTracker')}
                    </Link>
                    <Link href="/stats" className="hover:opacity-70 transition-opacity">
                        {t('stats')}
                    </Link>
                    <Link href="/how-to-track-work-hours" className="hover:opacity-70 transition-opacity">
                        {t('guide')}
                    </Link>
                </nav>

                <div className="hidden sm:block">
                    <LocaleSwitcher />
                </div>
                <MobileNav />
            </div>
        </header>
    );
}
