const configured = process.env.NEXT_PUBLIC_SITE_URL;

// Canonicals and sitemap links must point to the public site even when a
// local preview is built with NEXT_PUBLIC_SITE_URL=http://localhost:3000.
export const SITE_URL = configured?.startsWith('https://')
    ? configured.replace(/\/+$/, '')
    : 'https://belgaum.today';

export function absoluteUrl(path: string): string {
    return new URL(path, `${SITE_URL}/`).toString();
}
