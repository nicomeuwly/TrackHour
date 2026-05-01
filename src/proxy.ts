import createMiddleware from 'next-intl/middleware';
import { get } from '@vercel/edge-config';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const handleI18nRouting = createMiddleware(routing);

export const config = {
    matcher: '/((?!api|trpc|_next|_vercel|maintenance|.*\\..*).*)'
};

function isMaintenanceEnabled(value: unknown) {
    return value === true || value === 'true';
}

export async function proxy(request: NextRequest) {
    try {
        const maintenanceMode = await get('isInMaintenanceMode');

        if (isMaintenanceEnabled(maintenanceMode)) {
            const url = request.nextUrl.clone();
            url.pathname = '/maintenance';
            url.search = '';

            return NextResponse.rewrite(url);
        }
    } catch (error) {
        console.error('Unable to read maintenance mode from Edge Config', error);
    }

    return handleI18nRouting(request);
}
