/**
 * API Route Logging Wrapper — automatically logs request/response for any API route.
 * 
 * Usage:
 *   import { withLogging } from '@/lib/withLogging';
 *   export const GET = withLogging(async (request) => { ... });
 *   export const POST = withLogging(async (request) => { ... });
 */

import { NextRequest, NextResponse } from 'next/server';
import { fileLogger } from '@/lib/fileLogger';

type RouteHandler = (
    request: NextRequest,
    context?: { params?: Promise<Record<string, string>> }
) => Promise<NextResponse> | NextResponse;

export function withLogging<T extends (...args: never[]) => Promise<NextResponse> | NextResponse>(handler: T): T {
    const wrapped: RouteHandler = async (request, context) => {
        const startTime = Date.now();
        const method = request.method;
        const url = new URL(request.url);
        const path = url.pathname;
        const query = Object.fromEntries([...url.searchParams.entries()].map(([key, value]) => [
            key,
            /secret|token|password|key/i.test(key) ? '[REDACTED]' : value,
        ]));

        // Log incoming request
        fileLogger.apiRequest(method, path, {
            query: Object.keys(query).length > 0 ? query : undefined,
            userAgent: request.headers.get('user-agent')?.substring(0, 100),
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            contentType: request.headers.get('content-type'),
        });

        try {
            // Execute the actual handler
            const response = await (handler as unknown as RouteHandler)(request, context);
            const durationMs = Date.now() - startTime;

            // Log response
            fileLogger.apiResponse(method, path, response.status, durationMs, {
                query: Object.keys(query).length > 0 ? query : undefined,
            });

            return response;
        } catch (error) {
            const durationMs = Date.now() - startTime;

            // Log error
            fileLogger.apiError(method, path, error);
            fileLogger.apiResponse(method, path, 500, durationMs, {
                error: error instanceof Error ? error.message : String(error),
            });

            // Re-throw so the caller's error handling still works
            throw error;
        }
    };

    // Preserve the wrapped handler's parameter signature. Next.js validates
    // route exports and rejects a one-argument handler if the wrapper widens
    // it to an optional route context parameter.
    return wrapped as unknown as T;
}
