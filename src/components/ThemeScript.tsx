'use client';

import { THEME_INIT_SCRIPT } from '@/lib/theme';

// The script must run from the server HTML, before first paint. When React renders it
// on the client (e.g. the root layout re-rendering on a locale switch), it is inert anyway;
// a non-JS type keeps React from warning about it. suppressHydrationWarning covers the
// server/client type difference.
export default function ThemeScript() {
  const type = typeof window === 'undefined' ? 'text/javascript' : 'text/plain';
  return <script type={type} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />;
}
