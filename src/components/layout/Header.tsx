import { Link } from '@/i18n/navigation';
import LocaleSwitcher from './LocaleSwitcher';
import ThemeToggle from './ThemeToggle';
import MobileNav from './MobileNav';
import NavLinks from './NavLinks';

export default function Header() {
    return (
        <header className="relative bg-background border-b border-foreground/10">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                <Link href="/" className="text-xl font-bold tracking-tight hover:opacity-80 transition-opacity">
                    TrackHour
                </Link>

                <nav className="hidden sm:flex items-center gap-6 text-sm">
                    <NavLinks />
                </nav>

                <div className="hidden sm:flex items-center gap-1">
                    <ThemeToggle />
                    <LocaleSwitcher />
                </div>
                <MobileNav />
            </div>
        </header>
    );
}
