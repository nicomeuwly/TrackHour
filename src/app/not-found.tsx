import Link from 'next/link';

// Root fallback for paths that never reach the [locale] segment. It renders
// standalone (no locale layout), so it carries its own minimal markup.
export default function GlobalNotFound() {
    return (
        <html lang="en">
            <body
                style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: 0,
                    padding: '1.5rem',
                    background: '#fff',
                    color: '#111',
                    textAlign: 'center',
                }}
            >
                <main style={{ maxWidth: 420 }}>
                    <p style={{ fontSize: '3rem', fontWeight: 700, margin: '0 0 0.5rem' }}>404</p>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.75rem' }}>Page not found</h1>
                    <p style={{ color: '#555', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
                        This page does not exist or has moved.
                    </p>
                    <Link
                        href="/"
                        style={{
                            display: 'inline-block',
                            padding: '0.6rem 1.5rem',
                            border: '1px solid #111',
                            borderRadius: '0.5rem',
                            fontWeight: 600,
                            textDecoration: 'none',
                            color: '#111',
                        }}
                    >
                        Go to homepage
                    </Link>
                </main>
            </body>
        </html>
    );
}
