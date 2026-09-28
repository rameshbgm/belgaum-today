import { query, execute, insert } from '@/lib/db';
import { type TrendingResult } from '@/lib/openai';
import { POST as summarizeStory } from '@/app/api/story/[id]/summary/route';

type Article = { id: number; title: string; category: string; story_event_id: number | null };

async function ensureStory(article: Article): Promise<number> {
    if (article.story_event_id) return article.story_event_id;
    const createdId = await insert(
        'INSERT INTO story_events (title, category, first_seen_at, last_updated_at) VALUES (?, ?, NOW(), NOW())',
        [article.title.slice(0, 255), article.category]
    );
    const claimed = await execute('UPDATE articles SET story_event_id = ? WHERE id = ? AND story_event_id IS NULL', [createdId, article.id]);
    if (!claimed) {
        await execute('DELETE FROM story_events WHERE id = ?', [createdId]);
        const [current] = await query<Array<{ story_event_id: number | null }>>('SELECT story_event_id FROM articles WHERE id = ?', [article.id]);
        if (!current?.story_event_id) throw new Error('Could not attach selected article to a story');
        return current.story_event_id;
    }
    await insert('INSERT IGNORE INTO story_event_updates (story_event_id, article_id) VALUES (?, ?)', [createdId, article.id]);
    return createdId;
}

export async function selectAiSuggestion(category: string, trending: TrendingResult[]): Promise<boolean> {
    // The caller supplies rankings from a successful GPT-6 Luna analysis.
    const [pick] = trending;
    if (!pick) return false;
    const [article] = await query<Article[]>(
        'SELECT id, title, category, story_event_id FROM public_articles WHERE id = ? AND category = ? LIMIT 1',
        [pick.articleId, category]
    );
    if (!article) return false;
    const storyId = await ensureStory(article);
    const response = await summarizeStory(new Request('http://localhost/api/story/summary', { method: 'POST' }), {
        params: Promise.resolve({ id: String(storyId) }),
    });
    if (!response.ok) throw new Error(`Could not summarize selected story ${storyId}: ${response.status}`);
    await execute(
        `INSERT INTO ai_suggested_stories (category, story_event_id, article_id, ai_score, ai_reasoning, selected_at)
         VALUES (?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE story_event_id = VALUES(story_event_id), article_id = VALUES(article_id),
           ai_score = VALUES(ai_score), ai_reasoning = VALUES(ai_reasoning), selected_at = NOW()`,
        [category, storyId, article.id, pick.score, pick.reasoning]
    );
    return true;
}
