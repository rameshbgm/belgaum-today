import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export async function POST() {
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
}
