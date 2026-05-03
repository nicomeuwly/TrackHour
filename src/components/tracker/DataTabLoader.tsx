'use client';

import dynamic from 'next/dynamic';
import { useRouter } from '@/i18n/navigation';
import { ToastProvider } from '@/components/ui/Toast';

const DataTab = dynamic(() => import('./DataTab'), { ssr: false });

function DataTabWithNav() {
  const router = useRouter();
  return (
    <DataTab onNavigateToDay={(date) => router.push({ pathname: '/time-tracker', query: { date } })} />
  );
}

export default function DataTabLoader() {
  return (
    <ToastProvider>
      <DataTabWithNav />
    </ToastProvider>
  );
}
