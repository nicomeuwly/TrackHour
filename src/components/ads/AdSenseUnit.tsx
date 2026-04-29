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

export default function AdSenseUnit({ slot, format = 'auto', className }: AdSenseUnitProps) {
    useEffect(() => {
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch {
            // AdSense not loaded
        }
    }, []);

    return (
        <ins
            className={`adsbygoogle${className ? ` ${className}` : ''}`}
            style={{ display: 'block' }}
            data-ad-client="ca-pub-2897114925732533"
            data-ad-slot={slot}
            data-ad-format={format}
            data-full-width-responsive="true"
        />
    );
}
