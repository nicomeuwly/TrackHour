import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
    title: 'Maintenance | TrackHour',
    description: 'TrackHour is temporarily unavailable while maintenance is in progress.',
};

export default function MaintenanceLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
