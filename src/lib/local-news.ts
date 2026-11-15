const BELGAUM_LOCATION_PATTERN = /\b(?:belgaum|belagavi|belgaon)\b/i;

/** True when the headline or feed excerpt explicitly identifies Belgaum/Belagavi. */
export function isBelgaumStory(title: string, excerpt = ''): boolean {
    return BELGAUM_LOCATION_PATTERN.test(`${title} ${excerpt}`);
}
