import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';

// Parse .env.local manually
const envFile = readFileSync('.env.local', 'utf8');
for (const line of envFile.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
}

/**
 * Parse Google News HTML content to extract clean title and link
 */
function parseGoogleNewsContent(htmlContent) {
    // Google News format: <a href="URL" target="_blank">Title</a> <font color="#6f6f6f">Source</font>
    const linkMatch = htmlContent.match(/<a\s+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/);
    const sourceMatch = htmlContent.match(/<font[^>]*>([^<]+)<\/font>/);
    
    if (linkMatch) {
        return {
            title: linkMatch[2].trim(),
            link: linkMatch[1],
            source: sourceMatch ? sourceMatch[1].trim() : 'News.google.com',
        };
    }
    
    return null;
}

async function main() {
    const conn = await mysql.createConnection({
        host: process.env.DATABASE_HOST || 'localhost',
        user: process.env.DATABASE_USER || 'root',
        password: process.env.DATABASE_PASSWORD || '',
        database: process.env.DATABASE_NAME || 'belgaum_today',
        port: Number(process.env.DATABASE_PORT) || 3306,
    });

    console.log('🔧 Cleaning up Belgaum articles with corrupted content...\n');

    // Get all Belgaum articles with Google News source
    const [articles] = await conn.execute(
        `SELECT id, title, content, excerpt, source_url, source_name 
         FROM articles 
         WHERE category = 'belgaum' 
         AND (content LIKE '%<a href=%' OR excerpt LIKE '%<a href=%')`
    );

    if (!Array.isArray(articles) || articles.length === 0) {
        console.log('✅ No articles need cleaning!');
        await conn.end();
        return;
    }

    console.log(`Found ${articles.length} articles with HTML content\n`);

    let updated = 0;
    let skipped = 0;

    for (const article of articles) {
        const parsed = parseGoogleNewsContent(article.content);
        
        if (parsed) {
            // Update the article with cleaned content
            await conn.execute(
                `UPDATE articles 
                 SET title = ?, 
                     content = ?, 
                     excerpt = ?, 
                     source_url = ?, 
                     source_name = ?
                 WHERE id = ?`,
                [
                    parsed.title,
                    parsed.title, // Use clean title as content
                    parsed.title.substring(0, 200), // Use truncated title as excerpt
                    parsed.link,
                    parsed.source,
                    article.id
                ]
            );
            
            console.log(`✓ ${article.id}: ${parsed.title.substring(0, 60)}...`);
            console.log(`  Source: ${parsed.source}`);
            updated++;
        } else {
            console.log(`⏭ ${article.id}: Could not parse - ${article.title.substring(0, 60)}...`);
            skipped++;
        }
    }

    console.log(`\n✅ Done: ${updated} updated, ${skipped} skipped`);
    await conn.end();
}

main().catch(console.error);
