'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';

const NAV_LINKS = [
    { href: '/' as const, key: 'home' as const },
    { href: '/time-tracker' as const, key: 'timeTracker' as const },
    { href: '/stats' as const, key: 'stats' as const },
    { href: '/how-to-track-work-hours' as const, key: 'guide' as const },
];

export default function NavLinks({ onClick }: { onClick?: () => void }) {
    const t = useTranslations('Header');
    const pathname = usePathname();

    return (
        <>
            {NAV_LINKS.map(({ href, key }) => {
                const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
                return (
                    <Link
                        key={href}
                        href={href}
                        onClick={onClick}
                        className={`hover:opacity-70 transition-opacity ${isActive ? 'font-bold' : ''}`}
                    >
                        {t(key)}
                    </Link>
                );
            })}
        </>
    );
}
