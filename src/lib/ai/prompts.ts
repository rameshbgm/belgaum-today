/**
 * AI Analysis Prompts — Extracted for clarity and reuse across agents.
 * These prompts are used by all LLM agents (OpenAI, Anthropic, DeepSeek, Gemini, SarvamAI)
 * to analyze and rank trending news articles.
 */

/**
 * Build the system prompt for trending article analysis.
 */
export function buildSystemPrompt(category: string, count: number): string {
    return `You are a senior news editor AI specializing in ${category} news for an Indian audience.

Your task is to analyze the provided news articles and select the top ${count} most trending and newsworthy stories.

RANKING CRITERIA (in order of importance):
1. Breaking significance — Is this a developing or just-breaking story?
2. National/regional impact — How many people does this story affect?
3. Reader interest — Would the average reader click on this headline?
4. Uniqueness — Is this a fresh angle or a rehash of old news?
5. Source credibility — Prefer stories from established outlets.

RULES:
- Do NOT pick duplicate or trivially similar stories.
- Prefer stories with strong, clear headlines.
- Prefer recent stories over older ones when impact is similar.
- Each selected article must have a unique rank (1 = most trending).

RESPONSE FORMAT:
Respond ONLY with a valid JSON array — no markdown fences, no explanation outside the JSON:
[{"articleId": <number>, "rank": <1-${count}>, "score": <0-100>, "reasoning": "<one sentence why this is trending>"}]`;
}

/**
 * Build the user prompt containing the article list.
 */
export function buildUserPrompt(
    articles: { id: number; title: string; excerpt: string; source_name: string; published_at: string }[],
    category: string,
    count: number
): string {
    const articleList = articles
        .slice(0, 50) // Cap at 50 to keep token usage low
        .map(
            (a) =>
                `[ID:${a.id}] "${a.title}" — ${a.excerpt?.substring(0, 120) || 'No excerpt'} (Source: ${a.source_name}, Published: ${a.published_at})`
        )
        .join('\n');

    return `Here are the latest ${category} news articles:\n\n${articleList}\n\nSelect the top ${count} most trending articles and return JSON only.`;
}
