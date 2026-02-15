import { NextResponse, type NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = [
    '/admin/dashboard',
    '/admin/articles',
    '/admin/feeds',
    '/admin/logs',
    '/admin/settings',
];
const authRoutes = ['/admin/login'];

// Lightweight JWT decode for middleware (no crypto dependency)
// Full cryptographic verification happens in the API routes
function decodeToken(token: string): { userId: number; email: string; role: string; exp?: number } | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = JSON.parse(
            Buffer.from(parts[1], 'base64url').toString('utf-8')
        );
        // Check expiration
        if (payload.exp && payload.exp * 1000 < Date.now()) return null;
        if (!payload.userId || !payload.email || !payload.role) return null;
        return payload;
    } catch {
        return null;
    }
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const startTime = Date.now();
    const method = request.method;

    // Skip logging for static assets
    const isStatic = pathname.startsWith('/_next/') || pathname.endsWith('.ico') || pathname.endsWith('.css') || pathname.endsWith('.js') || pathname.endsWith('.png') || pathname.endsWith('.jpg') || pathname.endsWith('.svg') || pathname.endsWith('.woff2');

    // Log incoming request (Edge runtime — console only; file logging in API routes via withLogging)
    if (!isStatic) {
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
        const ua = request.headers.get('user-agent')?.substring(0, 80) || '-';
        console.log(`[REQ] → ${method} ${pathname} | IP: ${ip} | UA: ${ua}`);
    }

    // Get auth token from cookie
    const token = request.cookies.get('auth_token')?.value;
    const user = token ? decodeToken(token) : null;

    // Check if trying to access protected route
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

    // Redirect to login if accessing protected route without auth
    if (isProtectedRoute && !user) {
        const loginUrl = new URL('/admin/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        if (!isStatic) console.log(`[REQ] ← ${method} ${pathname} 302 (${Date.now() - startTime}ms) → /admin/login`);
        return NextResponse.redirect(loginUrl);
    }

    // Redirect to dashboard if accessing auth route while logged in
    if (isAuthRoute && user) {
        if (!isStatic) console.log(`[REQ] ← ${method} ${pathname} 302 (${Date.now() - startTime}ms) → /admin/dashboard`);
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }

    // Add user info + pathname to headers for admin routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-next-pathname', pathname);

    if (pathname.startsWith('/api/admin') && user) {
        requestHeaders.set('x-user-id', String(user.userId));
        requestHeaders.set('x-user-role', user.role);
    }

    if (!isStatic) {
        console.log(`[REQ] ← ${method} ${pathname} 200 (${Date.now() - startTime}ms)`);
    }

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/api/admin/:path*',
        // Include all routes to set x-next-pathname header for layout detection
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
