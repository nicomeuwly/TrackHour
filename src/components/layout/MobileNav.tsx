'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
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
                {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
            </button>

            {open && (
                <div className="absolute left-0 right-0 top-16 bg-background border-b border-text/10 z-50 px-4 py-6 flex flex-col gap-5">
                    <NavLinks onClick={() => setOpen(false)} />
                    <div className="pt-4 border-t border-text/10 flex items-center justify-between">
                        <LocaleSwitcher />
                        <ThemeToggle />
                    </div>
                </div>
            )}
        </div>
    );
}
