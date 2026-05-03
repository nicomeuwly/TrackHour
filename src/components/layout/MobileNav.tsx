'use client';

import { useState } from 'react';
import LocaleSwitcher from './LocaleSwitcher';
import ThemeToggle from './ThemeToggle';
import NavLinks from './NavLinks';

export default function MobileNav() {
    const [open, setOpen] = useState(false);

    return (
        <div className="sm:hidden">
            <button
                onClick={() => setOpen(v => !v)}
                aria-label={open ? 'Close menu' : 'Open menu'}
                aria-expanded={open}
                className="p-2 hover:opacity-70 transition-opacity"
            >
                {open ? (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="4" y1="4" x2="16" y2="16" />
                        <line x1="16" y1="4" x2="4" y2="16" />
                    </svg>
                ) : (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="3" y1="6" x2="17" y2="6" />
                        <line x1="3" y1="10" x2="17" y2="10" />
                        <line x1="3" y1="14" x2="17" y2="14" />
                    </svg>
                )}
            </button>

            {open && (
                <div className="absolute left-0 right-0 top-16 bg-background border-b border-foreground/10 z-50 px-4 py-6 flex flex-col gap-5">
                    <NavLinks onClick={() => setOpen(false)} />
                    <div className="pt-4 border-t border-foreground/10 flex items-center justify-between">
                        <LocaleSwitcher />
                        <ThemeToggle />
                    </div>
                </div>
            )}
        </div>
    );
}
