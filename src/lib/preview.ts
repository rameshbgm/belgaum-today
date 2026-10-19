/** Server-side preview policy. This flag is never enabled implicitly. */
export function isReadOnlyPreview(): boolean {
    return process.env.READ_ONLY_PREVIEW === '1';
}

export type PreviewAction = 'allow' | 'tracking' | 'block';

export function previewRequestAction(pathname: string, method: string, enabled = isReadOnlyPreview()): PreviewAction {
    if (!enabled || !pathname.startsWith('/api/')) return 'allow';
    const verb = method.toUpperCase();
    if (verb === 'POST' && ['/api/auth/login', '/api/auth/logout'].includes(pathname)) return 'allow';
    if (verb === 'POST' && ['/api/track/view', '/api/track/visit', '/api/track/source'].includes(pathname)) return 'tracking';
    // These GET routes can send email, ingest content, or change subscriptions.
    if (pathname.startsWith('/api/cron/') || pathname.startsWith('/api/digest/')) return 'block';
    return ['GET', 'HEAD', 'OPTIONS'].includes(verb) ? 'allow' : 'block';
}

export class ReadOnlyPreviewError extends Error {
    constructor() {
        super('Changes are unavailable in this read-only preview.');
        this.name = 'ReadOnlyPreviewError';
    }
}

export function assertPreviewWritable(enabled = isReadOnlyPreview()): void {
    if (enabled) throw new ReadOnlyPreviewError();
}

export function assertPreviewQueryAllowed(sql: string, enabled = isReadOnlyPreview()): void {
    if (!enabled) return;
    const statement = sql.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\n]*/g, ' ').trim().replace(/;\s*$/, '');
    // All application reads are SELECT statements. Fail closed for other SQL,
    // locking reads, file output, and multiple statements, including future code.
    if (!/^SELECT\b/i.test(statement) || /;|\bINTO\b|\bFOR\s+UPDATE\b|\bLOCK\s+IN\s+SHARE\s+MODE\b/i.test(statement)) {
        throw new ReadOnlyPreviewError();
    }
}
