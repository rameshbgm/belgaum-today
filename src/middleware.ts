import { NextResponse, type NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = [
    '/admin/dashboard',
    '/admin/articles',
    '/admin/agents',
    '/admin/feeds',
    '/admin/api-keys',
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
        return NextResponse.redirect(loginUrl);
    }

    // Redirect to dashboard if accessing auth route while logged in
    if (isAuthRoute && user) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }

    // Add user info + pathname to headers for admin routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-next-pathname', pathname);

    if (pathname.startsWith('/api/admin') && user) {
        requestHeaders.set('x-user-id', String(user.userId));
        requestHeaders.set('x-user-role', user.role);
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
