import type { RssItem } from '@/lib/rss';
import { config } from '@/lib/ai/config';

const CERTAIN_LOCAL = /\b(belagavi|belgaum|belgaon)\b/i;
const POSSIBLE_LOCAL = /\b(gokak|chikkodi|chikodi|athani|bailhongal|khanapur|ramdurg|saundatti|raibag|hukkeri|kittur|sankeshwar|nippani)\b/i;

/** Returns true only for stories about the city or district, not incidental mentions. */
export async function isBelagaviStory(item: Pick<RssItem, 'title' | 'description'>, localFeed: boolean): Promise<boolean> {
    const text = `${item.title} ${item.description}`;
    if (CERTAIN_LOCAL.test(item.title)) return true;
    if (!localFeed && !POSSIBLE_LOCAL.test(text) && !CERTAIN_LOCAL.test(text)) return false;
    if (!config.isValid) return false;

    try {
        const { ChatOpenAI } = await import('@langchain/openai');
        const { HumanMessage, SystemMessage } = await import('@langchain/core/messages');
        const usesCompletionTokens = config.model.startsWith('gpt-5') || config.model.startsWith('o1') || config.model.startsWith('o3');
        const model = new ChatOpenAI({
            apiKey: config.apiKey,
            modelName: config.model,
            temperature: usesCompletionTokens ? config.temperature : 0,
            maxTokens: usesCompletionTokens ? undefined : 100,
            timeout: 8000,
            modelKwargs: {
                response_format: { type: 'json_object' },
                ...(usesCompletionTokens ? { max_completion_tokens: 100 } : {}),
            },
        });
        const answer = await model.invoke([
            new SystemMessage('Classify whether this English news story is substantially about Belagavi city or Belagavi district, Karnataka. Incidental mentions are not enough. Reply only JSON: {"local":true} or {"local":false}.'),
            new HumanMessage(JSON.stringify({ title: item.title, excerpt: item.description.slice(0, 500) })),
        ]);
        const value = typeof answer.content === 'string' ? answer.content : String(answer.content);
        return JSON.parse(value).local === true;
    } catch {
        // With no human editor, uncertain stories are held out of local coverage.
        return false;
    }
}
