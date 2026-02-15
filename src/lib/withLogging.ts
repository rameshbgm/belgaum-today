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

export function withLogging(handler: RouteHandler): RouteHandler {
    return async (request: NextRequest, context?: { params?: Promise<Record<string, string>> }) => {
        const startTime = Date.now();
        const method = request.method;
        const url = new URL(request.url);
        const path = url.pathname;
        const query = Object.fromEntries(url.searchParams.entries());

        // Log incoming request
        fileLogger.apiRequest(method, path, {
            query: Object.keys(query).length > 0 ? query : undefined,
            userAgent: request.headers.get('user-agent')?.substring(0, 100),
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            contentType: request.headers.get('content-type'),
        });

        try {
            // Execute the actual handler
            const response = await handler(request, context);
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
}
