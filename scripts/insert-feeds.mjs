import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';

// Parse .env.local manually
const envFile = readFileSync('.env.local', 'utf8');
for (const line of envFile.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
}


const feeds = [
    // Belgaum/Belagavi - LOCAL NEWS
    { name: 'Google News - Belagavi', feed_url: 'https://news.google.com/rss/search?q=Belagavi&hl=en-IN&gl=IN&ceid=IN:en', category: 'belgaum' },
    { name: 'Google News - Belgaum', feed_url: 'https://news.google.com/rss/search?q=Belgaum&hl=en-IN&gl=IN&ceid=IN:en', category: 'belgaum' },
    { name: 'OneIndia Kannada - Belagavi', feed_url: 'https://kannada.oneindia.com/rss/feeds/kannada-belagavi-fb.xml', category: 'belgaum' },

    // India - TOP NATIONAL NEWS
    { name: 'NDTV - India News', feed_url: 'https://feeds.feedburner.com/ndtvnews-india-news', category: 'india' },
    { name: 'NDTV - Latest News', feed_url: 'https://feeds.feedburner.com/NDTV-LatestNews', category: 'india' },
    { name: 'Times of India - Top Stories', feed_url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms', category: 'india' },
    { name: 'The Hindu - National', feed_url: 'https://www.thehindu.com/news/national/feeder/default.rss', category: 'india' },
    { name: 'Hindustan Times - India', feed_url: 'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml', category: 'india' },

    // Business
    { name: 'Times of India - Business', feed_url: 'https://timesofindia.indiatimes.com/rssfeeds/1898055.cms', category: 'business' },
    { name: 'Moneycontrol - Business', feed_url: 'https://www.moneycontrol.com/rss/business.xml', category: 'business' },
    { name: 'Economic Times - Top Stories', feed_url: 'https://economictimes.indiatimes.com/rssfeedstopstories.cms', category: 'business' },
    { name: 'The Hindu - Business', feed_url: 'https://www.thehindu.com/business/feeder/default.rss', category: 'business' },

    // Technology
    { name: 'Times of India - Tech', feed_url: 'https://timesofindia.indiatimes.com/rssfeeds/1898055.cms', category: 'technology' },
    { name: 'Hindustan Times - Technology', feed_url: 'https://www.hindustantimes.com/feeds/rss/technology/rssfeed.xml', category: 'technology' },
    { name: 'The Hindu - Science & Tech', feed_url: 'https://www.thehindu.com/sci-tech/feeder/default.rss', category: 'technology' },
    { name: 'The Hindu - Science', feed_url: 'https://www.thehindu.com/sci-tech/science/feeder/default.rss', category: 'technology' },

    // Entertainment
    { name: 'Times of India - Entertainment', feed_url: 'https://timesofindia.indiatimes.com/rssfeeds/1081479906.cms', category: 'entertainment' },
    { name: 'The Hindu - Movies', feed_url: 'https://www.thehindu.com/entertainment/movies/feeder/default.rss', category: 'entertainment' },
    { name: 'The Hindu - Music', feed_url: 'https://www.thehindu.com/entertainment/music/feeder/default.rss', category: 'entertainment' },
    { name: 'The Hindu - Reviews', feed_url: 'https://www.thehindu.com/entertainment/reviews/feeder/default.rss', category: 'entertainment' },
    { name: 'Hindustan Times - Bollywood', feed_url: 'https://www.hindustantimes.com/feeds/rss/entertainment/bollywood/rssfeed.xml', category: 'entertainment' },
    { name: 'Hindustan Times - TV', feed_url: 'https://www.hindustantimes.com/feeds/rss/entertainment/tv/rssfeed.xml', category: 'entertainment' },

    // Sports
    { name: 'Times of India - Sports', feed_url: 'https://timesofindia.indiatimes.com/rssfeeds/1898272.cms', category: 'sports' },
    { name: 'The Hindu - Cricket', feed_url: 'https://www.thehindu.com/sport/cricket/feeder/default.rss', category: 'sports' },
    { name: 'The Hindu - Football', feed_url: 'https://www.thehindu.com/sport/football/feeder/default.rss', category: 'sports' },
    { name: 'The Hindu - Other Sports', feed_url: 'https://www.thehindu.com/sport/other-sports/feeder/default.rss', category: 'sports' },
    { name: 'Hindustan Times - Sports', feed_url: 'https://www.hindustantimes.com/feeds/rss/sports/rssfeed.xml', category: 'sports' },
    { name: 'Hindustan Times - Cricket', feed_url: 'https://www.hindustantimes.com/feeds/rss/sports/cricket/rssfeed.xml', category: 'sports' },
];

async function main() {
    const conn = await mysql.createConnection({
        host: process.env.DATABASE_HOST || 'localhost',
        user: process.env.DATABASE_USER || 'root',
        password: process.env.DATABASE_PASSWORD || '',
        database: process.env.DATABASE_NAME || 'belgaum_today',
        port: Number(process.env.DATABASE_PORT) || 3306,
    });

    let inserted = 0, skipped = 0;
    for (const f of feeds) {
        try {
            await conn.execute(
                'INSERT INTO rss_feed_config (name, feed_url, category, is_active) VALUES (?, ?, ?, true)',
                [f.name, f.feed_url, f.category]
            );
            inserted++;
            console.log(`✓ ${f.name}`);
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                skipped++;
                console.log(`⏭ ${f.name} (already exists)`);
            } else {
                console.error(`✗ ${f.name}:`, err.message);
            }
        }
    }

    console.log(`\nDone: ${inserted} inserted, ${skipped} skipped`);
    await conn.end();
}

main().catch(console.error);
