import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Category } from '@/types';
import { TOP_LEVEL_CATEGORIES } from '@/types';

export function digestConfigured(): boolean {
    return !!(process.env.RESEND_API_KEY && process.env.DIGEST_FROM_EMAIL &&
        process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32);
}

export function digestTopics(value: unknown): Category[] {
    if (!Array.isArray(value)) return ['belgaum', 'india'];
    return [...new Set(value.filter((item): item is Category => TOP_LEVEL_CATEGORIES.includes(item)))].slice(0, 7);
}

export function escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[character] || character);
}

export function unsubscribeToken(id: number, email: string): string {
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required');
    return createHmac('sha256', process.env.JWT_SECRET).update(`${id}:${email.toLowerCase()}:digest-unsubscribe`).digest('hex');
}

export function validUnsubscribeToken(id: number, email: string, token: string): boolean {
    if (!/^[a-f0-9]{64}$/i.test(token)) return false;
    const actual = Buffer.from(token, 'hex');
    const expected = Buffer.from(unsubscribeToken(id, email), 'hex');
    return timingSafeEqual(actual, expected);
}

export async function sendDigestEmail(to: string, subject: string, html: string, idempotencyKey?: string): Promise<void> {
    if (!digestConfigured()) throw new Error('Daily digest email is not configured');
    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
            ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
        },
        body: JSON.stringify({ from: process.env.DIGEST_FROM_EMAIL, to: [to], subject, html }),
        signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`Email provider returned HTTP ${response.status}`);
}
