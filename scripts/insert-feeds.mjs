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
    // Technology
    { name: 'Hindustan Times - Technology', feed_url: 'https://www.hindustantimes.com/feeds/rss/technology/rssfeed.xml', category: 'technology' },
    { name: 'The Hindu - Science', feed_url: 'https://www.thehindu.com/sci-tech/science/feeder/default.rss', category: 'technology' },
    // Entertainment
    { name: 'The Hindu - Art', feed_url: 'https://www.thehindu.com/entertainment/art/feeder/default.rss', category: 'entertainment' },
    { name: 'The Hindu - Dance', feed_url: 'https://www.thehindu.com/entertainment/dance/feeder/default.rss', category: 'entertainment' },
    { name: 'The Hindu - Movies', feed_url: 'https://www.thehindu.com/entertainment/movies/feeder/default.rss', category: 'entertainment' },
    { name: 'The Hindu - Music', feed_url: 'https://www.thehindu.com/entertainment/music/feeder/default.rss', category: 'entertainment' },
    { name: 'The Hindu - Reviews', feed_url: 'https://www.thehindu.com/entertainment/reviews/feeder/default.rss', category: 'entertainment' },
    { name: 'The Hindu - Theatre', feed_url: 'https://www.thehindu.com/entertainment/theatre/feeder/default.rss', category: 'entertainment' },
    { name: 'Hindustan Times - Bollywood', feed_url: 'https://www.hindustantimes.com/feeds/rss/entertainment/bollywood/rssfeed.xml', category: 'entertainment' },
    { name: 'Hindustan Times - Entertainment Others', feed_url: 'https://www.hindustantimes.com/feeds/rss/entertainment/others/rssfeed.xml', category: 'entertainment' },
    { name: 'Hindustan Times - Web Series', feed_url: 'https://www.hindustantimes.com/feeds/rss/entertainment/web-series/rssfeed.xml', category: 'entertainment' },
    { name: 'Hindustan Times - TV', feed_url: 'https://www.hindustantimes.com/feeds/rss/entertainment/tv/rssfeed.xml', category: 'entertainment' },
    // Sports
    { name: 'The Hindu - Cricket', feed_url: 'https://www.thehindu.com/sport/cricket/feeder/default.rss', category: 'sports' },
    { name: 'The Hindu - Football', feed_url: 'https://www.thehindu.com/sport/football/feeder/default.rss', category: 'sports' },
    { name: 'The Hindu - Hockey', feed_url: 'https://www.thehindu.com/sport/hockey/feeder/default.rss', category: 'sports' },
    { name: 'The Hindu - Tennis', feed_url: 'https://www.thehindu.com/sport/tennis/feeder/default.rss', category: 'sports' },
    { name: 'The Hindu - Athletics', feed_url: 'https://www.thehindu.com/sport/athletics/feeder/default.rss', category: 'sports' },
    { name: 'The Hindu - Motorsport', feed_url: 'https://www.thehindu.com/sport/motorsport/feeder/default.rss', category: 'sports' },
    { name: 'The Hindu - Races', feed_url: 'https://www.thehindu.com/sport/races/feeder/default.rss', category: 'sports' },
    { name: 'The Hindu - Other Sports', feed_url: 'https://www.thehindu.com/sport/other-sports/feeder/default.rss', category: 'sports' },
    { name: 'Hindustan Times - Sports', feed_url: 'https://www.hindustantimes.com/feeds/rss/sports/rssfeed.xml', category: 'sports' },
    { name: 'Hindustan Times - Sports Others', feed_url: 'https://www.hindustantimes.com/feeds/rss/sports/others/rssfeed.xml', category: 'sports' },
    { name: 'Hindustan Times - Football', feed_url: 'https://www.hindustantimes.com/feeds/rss/sports/football/rssfeed.xml', category: 'sports' },
    { name: 'Hindustan Times - Tennis', feed_url: 'https://www.hindustantimes.com/feeds/rss/sports/tennis/rssfeed.xml', category: 'sports' },
    { name: 'Hindustan Times - WWE', feed_url: 'https://www.hindustantimes.com/feeds/rss/sports/wwe-news/rssfeed.xml', category: 'sports' },
    { name: 'Hindustan Times - Sports Videos', feed_url: 'https://www.hindustantimes.com/feeds/rss/videos/sports/rssfeed.xml', category: 'sports' },
    { name: 'Hindustan Times - Badminton', feed_url: 'https://www.hindustantimes.com/feeds/rss/sports/badminton/rssfeed.xml', category: 'sports' },
    { name: 'Hindustan Times - Olympics', feed_url: 'https://www.hindustantimes.com/feeds/rss/sports/olympics/rssfeed.xml', category: 'sports' },
    { name: 'Hindustan Times - Hockey', feed_url: 'https://www.hindustantimes.com/feeds/rss/sports/hockey/rssfeed.xml', category: 'sports' },
    { name: 'Hindustan Times - Commonwealth', feed_url: 'https://www.hindustantimes.com/feeds/rss/sports/commonwealth-games/rssfeed.xml', category: 'sports' },
    { name: 'Hindustan Times - Sports Photos', feed_url: 'https://www.hindustantimes.com/feeds/rss/photos/sports/rssfeed.xml', category: 'sports' },
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
