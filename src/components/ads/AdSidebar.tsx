'use client';

import { usePathname } from 'next/navigation';
import AdSenseUnit from './AdSenseUnit';

const APP_PATHS = ['/time-tracker', '/pointeuse-en-ligne', '/stats', '/statistiques'];

export default function AdSidebar() {
    const pathname = usePathname();
    if (APP_PATHS.some((p) => pathname.endsWith(p))) return null;

    return (
        <>
            <div className="hidden [@media(min-width:1400px)]:flex fixed left-0 top-1/2 -translate-y-1/2 w-[160px] xl:w-[160px] flex-col items-center gap-4 px-2 pointer-events-none z-10">
                <div className="pointer-events-auto w-full">
                    <AdSenseUnit slot="sidebar-left" format="rectangle" className="w-full" />
                </div>
            </div>

            <div className="hidden [@media(min-width:1400px)]:flex fixed right-0 top-1/2 -translate-y-1/2 w-[160px] xl:w-[160px] flex-col items-center gap-4 px-2 pointer-events-none z-10">
                <div className="pointer-events-auto w-full">
                    <AdSenseUnit slot="sidebar-right" format="rectangle" className="w-full" />
                </div>
            </div>
        </>
    );
}
