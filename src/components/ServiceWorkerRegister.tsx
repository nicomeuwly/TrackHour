'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
    useEffect(() => {
        if (!('serviceWorker' in navigator)) return;

        // In development the SW serves stale pages and chunks from its caches, so edits
        // appear not to apply. Remove any worker left over from a previous session instead.
        if (process.env.NODE_ENV !== 'production') {
            navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
            return;
        }

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
    }, []);

    return null;
}
