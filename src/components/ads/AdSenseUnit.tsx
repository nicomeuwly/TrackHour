'use client';

import { useEffect, useState } from 'react';

type AdSenseUnitProps = {
    slot: string;
    format?: 'auto' | 'rectangle' | 'horizontal';
    className?: string;
};

declare global {
    interface Window {
        adsbygoogle: unknown[];
    }
}

const minHeights: Record<string, string> = {
    horizontal: 'min-h-[90px]',
    rectangle: 'min-h-[250px]',
    auto: 'min-h-[90px]',
};

export default function AdSenseUnit({ slot, format = 'auto', className }: AdSenseUnitProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch {
            // AdSense not loaded
        }
    }, []);

    const heightClass = `${minHeights[format]} ${className ?? ''}`;

    if (!mounted) return <div className={heightClass} />;

    return (
        <div className={heightClass}>
            <ins
                className="adsbygoogle"
                style={{ display: 'block', width: '100%', height: '100%' }}
                data-ad-client="ca-pub-2897114925732533"
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive="true"
            />
        </div>
    );
}
