const belgaumFeeds = [
    { name: 'Google News - Belagavi', url: 'https://news.google.com/rss/search?q=Belagavi&hl=en-IN&gl=IN&ceid=IN:en' },
    { name: 'Google News - Belgaum', url: 'https://news.google.com/rss/search?q=Belgaum&hl=en-IN&gl=IN&ceid=IN:en' },
    { name: 'OneIndia Kannada - Belagavi', url: 'https://kannada.oneindia.com/rss/feeds/kannada-belagavi-fb.xml' },
];

async function testFeed(name, url) {
    try {
        console.log(`\n🔍 Testing: ${name}`);
        console.log(`   URL: ${url}`);
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Belgaum.Today/1.0',
            },
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const xmlText = await response.text();
        
        // Basic XML parsing to count items
        const itemMatches = xmlText.match(/<item>/g) || [];
        const titleMatches = xmlText.match(/<title>([^<]+)<\/title>/g) || [];
        
        console.log(`   ✅ Status: ${response.status} ${response.statusText}`);
        console.log(`   📰 Items found: ${itemMatches.length}`);
        
        if (titleMatches.length > 0) {
            console.log(`   📌 Sample titles (first 3):`);
            for (let i = 0; i < Math.min(3, titleMatches.length); i++) {
                const title = titleMatches[i].replace(/<title>|<\/title>/g, '').replace(/<!\[CDATA\[|\]\]>/g, '');
                console.log(`      ${i + 1}. ${title.substring(0, 80)}${title.length > 80 ? '...' : ''}`);
            }
        }
        
        return true;
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('🚀 Testing Belgaum RSS Feeds\n');
    console.log('='.repeat(70));
    
    let success = 0, failed = 0;
    
    for (const feed of belgaumFeeds) {
        const result = await testFeed(feed.name, feed.url);
        if (result) success++;
        else failed++;
    }
    
    console.log('\n' + '='.repeat(70));
    console.log(`\n📊 Results: ✅ Success: ${success}, ❌ Failed: ${failed}`);
    
    if (success === belgaumFeeds.length) {
        console.log('🎉 All feeds are working! Ready to insert into database.\n');
    } else {
        console.log('⚠️  Some feeds failed. Please check the errors above.\n');
    }
}

main().catch(console.error);
