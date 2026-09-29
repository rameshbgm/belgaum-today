/** JSON embedded in a script element must not contain a literal closing tag. */
export function safeJsonLd(value: unknown): string {
    return JSON.stringify(value).replace(/</g, '\\u003c');
}
