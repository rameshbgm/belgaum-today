export function assertSourcePolicyConfigured(): void {
    // Admin-added RSS feeds are the source of trust. Kept as a compatibility
    // hook for existing callers; there is no code-level publisher block list.
}

export function isBlockedSource(url: string | null | undefined, sourceName?: string | null): boolean {
    void url;
    void sourceName;
    return false;
}

export function hasNonEnglishScript(text: string): boolean {
    return /[\p{Script=Kannada}\p{Script=Devanagari}\p{Script=Tamil}\p{Script=Telugu}\p{Script=Malayalam}\p{Script=Bengali}\p{Script=Arabic}]/u.test(text);
}

export function publisherUrl(url: string): string | null {
    try {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) return null;
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

/** Publisher domain configured by admin, never a feed aggregator or URL path. */
export function normalizePublisherDomain(value: string): string | null {
    const host = value.trim().toLowerCase().replace(/^www\./, '');
    if (!/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(host) || host.split('.').length < 2) return null;
    return host;
}

export function publisherDomainUrl(url: string, domain: string): string | null {
    const clean = publisherUrl(url);
    const expected = normalizePublisherDomain(domain);
    if (!clean || !expected) return null;
    const host = new URL(clean).hostname.toLowerCase().replace(/^www\./, '');
    return host === expected || host.endsWith(`.${expected}`) ? clean : null;
}

export function directPublisherFeed(feedUrl: string, domain: string): boolean {
    void domain;
    return publisherUrl(feedUrl) !== null;
}
