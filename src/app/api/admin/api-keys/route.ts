import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { encryptApiKey, maskApiKey, decryptApiKey } from '@/lib/ai/crypto';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/api-keys — List all API keys (masked)
 */
export async function GET() {
    try {
        const keys = await query<Array<{
            id: number; provider_id: number; key_name: string;
            api_key_encrypted: string; is_active: boolean;
            last_used_at: string | null; created_at: string;
            provider_name: string; provider_display_name: string;
        }>>(
            `SELECT k.*, p.name as provider_name, p.display_name as provider_display_name
             FROM ai_api_keys k
             JOIN ai_providers p ON k.provider_id = p.id
             ORDER BY p.name, k.created_at DESC`
        );

        // Mask keys for display
        const maskedKeys = keys.map(k => {
            let masked = '****';
            try {
                const plainKey = decryptApiKey(k.api_key_encrypted);
                masked = maskApiKey(plainKey);
            } catch { /* ignore decryption errors */ }

            return {
                id: k.id,
                provider_id: k.provider_id,
                key_name: k.key_name,
                masked_key: masked,
                is_active: k.is_active,
                last_used_at: k.last_used_at,
                created_at: k.created_at,
                provider_name: k.provider_name,
                provider_display_name: k.provider_display_name,
            };
        });

        return NextResponse.json({ success: true, data: maskedKeys });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch API keys' }, { status: 500 });
    }
}

/**
 * POST /api/admin/api-keys — Add a new API key (encrypted)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { provider_id, key_name, api_key } = body;

        if (!provider_id || !key_name || !api_key) {
            return NextResponse.json({ success: false, error: 'provider_id, key_name, and api_key are required' }, { status: 400 });
        }

        const encrypted = encryptApiKey(api_key);

        await execute(
            'INSERT INTO ai_api_keys (provider_id, key_name, api_key_encrypted) VALUES (?, ?, ?)',
            [provider_id, key_name, encrypted]
        );

        return NextResponse.json({ success: true, message: 'API key added' });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to add API key' }, { status: 500 });
    }
}

/**
 * PATCH /api/admin/api-keys — Toggle key active status or rename
 */
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, is_active, key_name } = body;

        if (!id) {
            return NextResponse.json({ success: false, error: 'Key ID is required' }, { status: 400 });
        }

        const updates: string[] = [];
        const params: (string | number | boolean)[] = [];

        if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active); }
        if (key_name) { updates.push('key_name = ?'); params.push(key_name); }

        if (updates.length === 0) {
            return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 });
        }

        params.push(id);
        await execute(`UPDATE ai_api_keys SET ${updates.join(', ')} WHERE id = ?`, params);

        return NextResponse.json({ success: true, message: 'API key updated' });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to update API key' }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/api-keys — Delete an API key
 */
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });

        await execute('DELETE FROM ai_api_keys WHERE id = ?', [id]);
        return NextResponse.json({ success: true, message: 'API key deleted' });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to delete API key' }, { status: 500 });
    }
}
