/**
 * RSS Feed Parser & Validator
 * Parses RSS XML from Hindustan Times and The Hindu,
 * validates entries, extracts images, and returns structured items.
 */

export interface RssItem {
    title: string;
    description: string;
    link: string;
    imageUrl: string | null;
    pubDate: Date;
    guid: string;
    sourceName: string;
}

export interface RssFeedConfig {
    id: number;
    name: string;
    feed_url: string;
    category: string;
    is_active: boolean;
    last_fetched_at: Date | null;
}

/**
 * Strip HTML tags and CDATA wrappers from a string
 */
function stripHtml(html: string): string {
    // Remove CDATA wrappers
    let text = html.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
    // Remove HTML tags
    text = text.replace(/<[^>]*>/g, '');
    // Decode common HTML entities
    text = text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, '/');
    // Collapse whitespace
    text = text.replace(/\s+/g, ' ').trim();
    return text;
}

/**
 * Extract text content from an XML tag
 */
function extractTag(xml: string, tag: string): string | null {
    // Handle CDATA-wrapped content
    const cdataRegex = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`, 'i');
    const cdataMatch = xml.match(cdataRegex);
    if (cdataMatch) return cdataMatch[1].trim();

    // Handle regular content
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim() : null;
}

/**
 * Extract link URL from RSS item — handles RSS 2.0 plain text links,
 * CDATA-wrapped links, and Atom-style href attributes.
 */
function extractLink(itemXml: string): string | null {
    // Standard extractTag covers CDATA and normal <link>...</link>
    const fromTag = extractTag(itemXml, 'link');
    if (fromTag && fromTag.startsWith('http')) return fromTag;

    // Atom: <link href="..."/> or <link rel="alternate" href="..."/>
    const atomHref = itemXml.match(/<link[^>]+href=["']([^"']+)["']/i);
    if (atomHref) return atomHref[1];

    // Some RSS 2.0 feeds put the URL between tags without closing properly
    // e.g. <link>https://example.com/story</link> but regex missed it
    const rawLink = itemXml.match(/<link>\s*(https?:\/\/[^\s<]+)\s*<\/link>/i);
    if (rawLink) return rawLink[1];

    return fromTag; // return whatever we got (might be null)
}

/**
 * Extract image URL from media:content, enclosure, or description
 */
function extractImageUrl(itemXml: string): string | null {
    // Try media:content url attribute
    const mediaMatch = itemXml.match(/<media:content[^>]+url=["']([^"']+)["']/i);
    if (mediaMatch) return mediaMatch[1];

    // Try media:thumbnail url attribute
    const thumbMatch = itemXml.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i);
    if (thumbMatch) return thumbMatch[1];

    // Try enclosure with image type
    const enclosureMatch = itemXml.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image\/[^"']+["']/i);
    if (enclosureMatch) return enclosureMatch[1];

    // Try enclosure without type check (often images)
    const enclosureAnyMatch = itemXml.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
    if (enclosureAnyMatch && /\.(jpg|jpeg|png|gif|webp)/i.test(enclosureAnyMatch[1])) {
        return enclosureAnyMatch[1];
    }

    // Try to find image in description HTML
    const descContent = extractTag(itemXml, 'description');
    if (descContent) {
        const imgMatch = descContent.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgMatch) return imgMatch[1];
    }

    return null;
}

/**
 * Parse Google News description HTML to extract title, link, and source
 */
function parseGoogleNewsDescription(html: string): { title: string; link: string; source: string } | null {
    // Google News format: <a href="URL" target="_blank">Title</a> <font color="#6f6f6f">Source</font>
    const linkMatch = html.match(/<a\s+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/);
    const sourceMatch = html.match(/<font[^>]*>([^<]+)<\/font>/);
    
    if (linkMatch) {
        return {
            title: stripHtml(linkMatch[2]),
            link: linkMatch[1],
            source: sourceMatch ? stripHtml(sourceMatch[1]) : 'News.google.com',
        };
    }
    
    return null;
}

/**
 * Derive source name from feed URL
 */
function getSourceName(feedUrl: string): string {
    if (feedUrl.includes('hindustantimes.com')) return 'Hindustan Times';
    if (feedUrl.includes('thehindu.com')) return 'The Hindu';
    if (feedUrl.includes('news.google.com')) return 'News.google.com';
    if (feedUrl.includes('oneindia.com')) return 'OneIndia';
    // Fallback: extract domain name
    try {
        const domain = new URL(feedUrl).hostname.replace('www.', '');
        return domain.charAt(0).toUpperCase() + domain.slice(1);
    } catch {
        return 'Unknown Source';
    }
}

const BROWSER_USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0',
];

function getRandomUA(): string {
    return BROWSER_USER_AGENTS[Math.floor(Math.random() * BROWSER_USER_AGENTS.length)];
}

async function fetchWithBrowserHeaders(url: string): Promise<Response> {
    const headers = {
        'User-Agent': getRandomUA(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,application/rss+xml,application/atom+xml,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': 'https://www.google.com/',
    };

    let res = await fetch(url, { headers, redirect: 'follow', next: { revalidate: 0 } });

    // If blocked, retry with a different UA after short delay
    if (!res.ok && res.status === 403) {
        await new Promise(r => setTimeout(r, 500));
        res = await fetch(url, {
            headers: { ...headers, 'User-Agent': getRandomUA() },
            redirect: 'follow',
            next: { revalidate: 0 },
        });
    }

    return res;
}

/**
 * Parse RSS XML feed and return validated items
 */
export async function parseRssFeed(feedUrl: string): Promise<RssItem[]> {
    const response = await fetchWithBrowserHeaders(feedUrl);

    if (!response.ok) {
        console.error(`Failed to fetch RSS feed: ${feedUrl} — status ${response.status}`);
        return [];
    }

    const xml = await response.text();
    const sourceName = getSourceName(feedUrl);
    const items: RssItem[] = [];

    // Split XML into individual <item> blocks
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
    let match;

    const isGoogleNews = feedUrl.includes('news.google.com');

    while ((match = itemRegex.exec(xml)) !== null) {
        const itemXml = match[1];

        // Extract fields
        let title = extractTag(itemXml, 'title');
        let link = extractLink(itemXml);
        let description = extractTag(itemXml, 'description');
        const pubDateStr = extractTag(itemXml, 'pubDate');
        let guid = extractTag(itemXml, 'guid') || link;
        let itemSourceName = sourceName;

        // Special handling for Google News feeds
        if (isGoogleNews && description) {
            const googleNewsData = parseGoogleNewsDescription(description);
            if (googleNewsData) {
                title = googleNewsData.title;
                link = googleNewsData.link;
                itemSourceName = googleNewsData.source;
                // Clean description becomes just the title
                description = googleNewsData.title;
            } else {
                // Fallback: strip HTML even if parser didn't match
                description = stripHtml(description);
            }
        }

        // Validation: must have title and link at minimum
        if (!title || !link) {
            continue;
        }

        // Parse and validate publication date
        let pubDate: Date;
        if (pubDateStr) {
            pubDate = new Date(pubDateStr);
            if (isNaN(pubDate.getTime())) {
                pubDate = new Date();
            }
        } else {
            pubDate = new Date();
        }

        // Extract image
        const imageUrl = extractImageUrl(itemXml);

        // Always strip HTML from title and description to prevent raw markup in DB
        const cleanTitle = stripHtml(title);
        const cleanDescription = description ? stripHtml(description) : cleanTitle;

        // Skip if title is too short (likely invalid)
        if (cleanTitle.length < 10) {
            continue;
        }

        items.push({
            title: cleanTitle,
            description: cleanDescription.length > 500
                ? cleanDescription.substring(0, 497) + '...'
                : cleanDescription,
            link: link.trim(),
            imageUrl,
            pubDate,
            guid: guid || link,
            sourceName: itemSourceName,
        });
    }

    return items;
}

/**
 * Fetch and parse multiple RSS feeds
 */
export async function fetchAllFeeds(
    feeds: RssFeedConfig[]
): Promise<{ feedId: number; items: RssItem[] }[]> {
    const results = await Promise.allSettled(
        feeds.map(async (feed) => {
            const items = await parseRssFeed(feed.feed_url);
            return { feedId: feed.id, items };
        })
    );

    return results
        .filter((r): r is PromiseFulfilledResult<{ feedId: number; items: RssItem[] }> =>
            r.status === 'fulfilled'
        )
        .map((r) => r.value);
}
