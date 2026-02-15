import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';
import { withLogging } from '@/lib/withLogging';

export const POST = withLogging(async () => {
    try {
        await clearAuthCookie();

        return NextResponse.json({
            success: true,
            data: { loggedOut: true },
        });
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { success: false, error: 'Logout failed', code: 500 },
            { status: 500 }
        );
    }
});