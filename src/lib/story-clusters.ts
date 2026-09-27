/** Keep one visible card for identical headlines while retaining every publisher record. */
export function distinctStories<T extends { title: string }>(stories: T[]): T[] {
    const seen = new Set<string>();
    return stories.filter(story => {
        const key = story.title.normalize('NFKC').toLowerCase()
            .replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}
