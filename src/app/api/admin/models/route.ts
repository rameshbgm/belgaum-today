import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/models — List all AI models (optionally filter by provider)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const providerId = searchParams.get('provider_id');

        let sql = `SELECT m.*, p.name as provider_name, p.display_name as provider_display_name
                    FROM ai_models m
                    JOIN ai_providers p ON m.provider_id = p.id`;
        const params: string[] = [];

        if (providerId) {
            sql += ' WHERE m.provider_id = ?';
            params.push(providerId);
        }
        sql += ' ORDER BY p.name, m.is_default DESC, m.display_name';

        const models = await query(sql, params);
        return NextResponse.json({ success: true, data: models });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch models' }, { status: 500 });
    }
}

/**
 * POST /api/admin/models — Add a new model
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { provider_id, model_id, display_name, max_tokens, temperature } = body;

        if (!provider_id || !model_id || !display_name) {
            return NextResponse.json({ success: false, error: 'provider_id, model_id, and display_name are required' }, { status: 400 });
        }

        await execute(
            'INSERT INTO ai_models (provider_id, model_id, display_name, max_tokens, temperature) VALUES (?, ?, ?, ?, ?)',
            [provider_id, model_id, display_name, max_tokens || 1000, temperature || 0.3]
        );

        return NextResponse.json({ success: true, message: 'Model added' });
    } catch (error: any) {
        if (error?.code === 'ER_DUP_ENTRY') {
            return NextResponse.json({ success: false, error: 'Model already exists for this provider' }, { status: 409 });
        }
        return NextResponse.json({ success: false, error: 'Failed to add model' }, { status: 500 });
    }
}

/**
 * PATCH /api/admin/models — Update a model (toggle active/default, edit)
 */
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, is_active, is_default, display_name, max_tokens, temperature } = body;

        if (!id) {
            return NextResponse.json({ success: false, error: 'Model ID is required' }, { status: 400 });
        }

        // If setting as default, unset others in same provider
        if (is_default === true) {
            const model = await query<Array<{ provider_id: number }>>(
                'SELECT provider_id FROM ai_models WHERE id = ?', [id]
            );
            if (model.length > 0) {
                await execute(
                    'UPDATE ai_models SET is_default = false WHERE provider_id = ?',
                    [model[0].provider_id]
                );
            }
        }

        const updates: string[] = [];
        const params: (string | number | boolean)[] = [];

        if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active); }
        if (is_default !== undefined) { updates.push('is_default = ?'); params.push(is_default); }
        if (display_name) { updates.push('display_name = ?'); params.push(display_name); }
        if (max_tokens !== undefined) { updates.push('max_tokens = ?'); params.push(max_tokens); }
        if (temperature !== undefined) { updates.push('temperature = ?'); params.push(temperature); }

        if (updates.length === 0) {
            return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 });
        }

        params.push(id);
        await execute(`UPDATE ai_models SET ${updates.join(', ')} WHERE id = ?`, params);

        return NextResponse.json({ success: true, message: 'Model updated' });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to update model' }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/models — Delete a model
 */
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });

        await execute('DELETE FROM ai_models WHERE id = ?', [id]);
        return NextResponse.json({ success: true, message: 'Model deleted' });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to delete model' }, { status: 500 });
    }
}
