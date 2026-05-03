'use client';

import AdSenseUnit from './AdSenseUnit';

export default function AdSidebar() {
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
