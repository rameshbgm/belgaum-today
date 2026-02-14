import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyPassword, generateToken, setAuthCookie } from '@/lib/auth';
import { User, AuthPayload } from '@/types';
import { isValidEmail } from '@/lib/utils';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        // Validation
        if (!email || !password) {
            return NextResponse.json(
                { success: false, error: 'Email and password are required', code: 400 },
                { status: 400 }
            );
        }

        if (!isValidEmail(email)) {
            return NextResponse.json(
                { success: false, error: 'Invalid email format', code: 400 },
                { status: 400 }
            );
        }

        // Find user
        let user: User | null = null;

        try {
            const users = await query<User[]>(
                `SELECT * FROM users WHERE email = ? LIMIT 1`,
                [email]
            );
            user = users.length > 0 ? users[0] : null;
        } catch {
            // Mock user for development when DB is not available
            if (email === 'admin@belgaum.today' && password === 'admin123') {
                const mockPayload: AuthPayload = {
                    userId: 1,
                    email: 'admin@belgaum.today',
                    role: 'admin',
                };
                const token = generateToken(mockPayload);
                await setAuthCookie(token);

                return NextResponse.json({
                    success: true,
                    data: {
                        user: {
                            id: 1,
                            email: 'admin@belgaum.today',
                            name: 'Admin',
                            role: 'admin',
                        },
                    },
                });
            }

            return NextResponse.json(
                { success: false, error: 'Invalid credentials', code: 401 },
                { status: 401 }
            );
        }

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Invalid credentials', code: 401 },
                { status: 401 }
            );
        }

        // Verify password
        const isValid = await verifyPassword(password, user.password_hash);
        if (!isValid) {
            return NextResponse.json(
                { success: false, error: 'Invalid credentials', code: 401 },
                { status: 401 }
            );
        }

        // Generate token
        const payload: AuthPayload = {
            userId: user.id,
            email: user.email,
            role: user.role,
        };
        const token = generateToken(payload);

        // Set cookie
        await setAuthCookie(token);

        return NextResponse.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                },
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { success: false, error: 'Login failed', code: 500 },
            { status: 500 }
        );
    }
}
