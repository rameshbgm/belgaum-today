/** Source rules are configured outside Git so excluded publishers stay out of repository history. */
function configuredDomains(): string[] {
    return (process.env.BLOCKED_SOURCE_DOMAINS || '')
        .split(',')
        .map(value => value.trim().toLowerCase().replace(/^www\./, ''))
        .filter(Boolean);
}

export function assertSourcePolicyConfigured(): void {
    if (process.env.NODE_ENV === 'production' && configuredDomains().length === 0) {
        throw new Error('BLOCKED_SOURCE_DOMAINS must be configured before publishing feeds');
    }
}

export function isBlockedSource(url: string | null | undefined, sourceName?: string | null): boolean {
    const domains = configuredDomains();
    if (domains.length === 0) return false;

    let hostname = '';
    try {
        hostname = new URL(url || '').hostname.toLowerCase().replace(/^www\./, '');
    } catch { /* Names are checked below when no URL is present. */ }

    const normalizedName = (sourceName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return domains.some(domain => {
        const brand = domain.split('.')[0].replace(/[^a-z0-9]/g, '');
        return hostname === domain || hostname.endsWith(`.${domain}`) ||
            (brand.length >= 5 && normalizedName.includes(brand));
    });
}

export function hasNonEnglishScript(text: string): boolean {
    return /[\p{Script=Kannada}\p{Script=Devanagari}\p{Script=Tamil}\p{Script=Telugu}\p{Script=Malayalam}\p{Script=Bengali}\p{Script=Arabic}]/u.test(text);
}

export function publisherUrl(url: string): string | null {
    try {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) return null;
        if (parsed.hostname === 'news.google.com' || parsed.hostname.endsWith('.news.google.com')) return null;
        if (isBlockedSource(parsed.href)) return null;
        for (const key of [...parsed.searchParams.keys()]) {
            if (key.startsWith('utm_') || ['fbclid', 'gclid', 'mc_cid', 'mc_eid'].includes(key)) {
                parsed.searchParams.delete(key);
            }
        }
        return parsed.href;
    } catch {
        return null;
    }
}

export async function resolvePublisherUrl(url: string): Promise<string | null> {
    const direct = publisherUrl(url);
    if (direct) return direct;
    if (!url.startsWith('https://news.google.com/')) return null;

    try {
        const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(5000) });
        return publisherUrl(response.url);
    } catch {
        return null;
    }
}
