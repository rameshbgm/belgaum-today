import Link from 'next/link';

export default async function DigestPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
    const { status } = await searchParams;
    const message: Record<string, string> = {
        verified: 'Your daily digest is confirmed.',
        unsubscribed: 'You have unsubscribed from the daily digest.',
        invalid: 'This link is invalid or has already been used.',
        error: 'We could not complete that request. Please try again later.',
    };
    return <main className="container mx-auto max-w-xl px-4 py-20">
        <h1 className="font-display text-4xl font-bold text-ink">Daily digest</h1>
        <p className="mt-5 text-lg text-muted">{message[status || ''] || 'Follow the news that matters to you.'}</p>
        <Link href="/" className="mt-8 inline-block font-semibold text-primary hover:underline">Back to the news</Link>
    </main>;
}
