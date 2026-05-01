'use client';

import { useEffect } from 'react';

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
    useEffect(() => {
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch {
            // AdSense not loaded
        }
    }, []);

    return (
        <div className={`${minHeights[format]} ${className ?? ''}`}>
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
