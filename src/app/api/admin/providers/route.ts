import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/providers — List all AI providers
 */
export async function GET() {
    try {
        const providers = await query(
            `SELECT p.*, 
                    (SELECT COUNT(*) FROM ai_models WHERE provider_id = p.id) as model_count,
                    (SELECT COUNT(*) FROM ai_api_keys WHERE provider_id = p.id AND is_active = true) as key_count
             FROM ai_providers p ORDER BY p.is_default DESC, p.name`
        );
        return NextResponse.json({ success: true, data: providers });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch providers' }, { status: 500 });
    }
}

/**
 * POST /api/admin/providers — Create a new AI provider
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, display_name, base_url, api_format } = body;

        if (!name || !display_name) {
            return NextResponse.json({ success: false, error: 'Name and display name are required' }, { status: 400 });
        }

        await execute(
            'INSERT INTO ai_providers (name, display_name, base_url, api_format) VALUES (?, ?, ?, ?)',
            [name.toLowerCase().replace(/\s+/g, '_'), display_name, base_url || null, api_format || 'openai']
        );

        return NextResponse.json({ success: true, message: 'Provider created' });
    } catch (error: any) {
        if (error?.code === 'ER_DUP_ENTRY') {
            return NextResponse.json({ success: false, error: 'Provider already exists' }, { status: 409 });
        }
        return NextResponse.json({ success: false, error: 'Failed to create provider' }, { status: 500 });
    }
}

/**
 * PATCH /api/admin/providers — Update a provider (toggle active/default, edit)
 */
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, is_active, is_default, display_name, base_url, api_format } = body;

        if (!id) {
            return NextResponse.json({ success: false, error: 'Provider ID is required' }, { status: 400 });
        }

        // If setting as default, unset all others first
        if (is_default === true) {
            await execute('UPDATE ai_providers SET is_default = false');
        }

        const updates: string[] = [];
        const params: (string | number | boolean)[] = [];

        if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active); }
        if (is_default !== undefined) { updates.push('is_default = ?'); params.push(is_default); }
        if (display_name) { updates.push('display_name = ?'); params.push(display_name); }
        if (base_url !== undefined) { updates.push('base_url = ?'); params.push(base_url); }
        if (api_format) { updates.push('api_format = ?'); params.push(api_format); }

        if (updates.length === 0) {
            return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 });
        }

        params.push(id);
        await execute(`UPDATE ai_providers SET ${updates.join(', ')} WHERE id = ?`, params);

        return NextResponse.json({ success: true, message: 'Provider updated' });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to update provider' }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/providers — Delete a provider
 */
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });

        await execute('DELETE FROM ai_providers WHERE id = ?', [id]);
        return NextResponse.json({ success: true, message: 'Provider deleted' });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to delete provider' }, { status: 500 });
    }
}
