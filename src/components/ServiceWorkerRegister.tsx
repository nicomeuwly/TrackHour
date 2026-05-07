'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js')
                .then((reg) => {
                    reg.addEventListener('updatefound', () => {
                        const newSW = reg.installing;
                        newSW?.addEventListener('statechange', () => {
                            if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
                                newSW.postMessage({ type: 'SKIP_WAITING' });
                            }
                        });
                    });
                })
                .catch(() => {});
        }
    }, []);

    return null;
}
