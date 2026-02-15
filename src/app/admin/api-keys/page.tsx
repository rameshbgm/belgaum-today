'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Key, Plus, Trash2, Power, PowerOff, Eye, EyeOff, Loader2, Shield
} from 'lucide-react';
import { Button, Card, CardContent, Badge, Input, useToast } from '@/components/ui';

interface ApiKey {
    id: number;
    provider_id: number;
    key_name: string;
    masked_key: string;
    is_active: boolean;
    last_used_at: string | null;
    created_at: string;
    provider_name: string;
    provider_display_name: string;
}

interface Provider {
    id: number;
    name: string;
    display_name: string;
}

export default function ApiKeysPage() {
    const { showToast } = useToast();
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [providers, setProviders] = useState<Provider[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [newKey, setNewKey] = useState({ provider_id: '', key_name: '', api_key: '' });
    const [showApiKey, setShowApiKey] = useState(false);

    const fetchKeys = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/api-keys');
            const data = await res.json();
            if (data.success) setKeys(data.data);
        } catch { /* ignore */ }
    }, []);

    const fetchProviders = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/providers');
            const data = await res.json();
            if (data.success) setProviders(data.data);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        Promise.all([fetchKeys(), fetchProviders()]).finally(() => setLoading(false));
    }, [fetchKeys, fetchProviders]);

    const addKey = async () => {
        if (!newKey.provider_id || !newKey.key_name || !newKey.api_key) {
            return showToast('All fields are required', 'error');
        }
        const res = await fetch('/api/admin/api-keys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...newKey, provider_id: parseInt(newKey.provider_id) }),
        });
        const data = await res.json();
        if (data.success) {
            showToast('API key added and encrypted', 'success');
            setShowAdd(false);
            setNewKey({ provider_id: '', key_name: '', api_key: '' });
            fetchKeys();
        } else {
            showToast(data.error || 'Failed', 'error');
        }
    };

    const toggleKey = async (id: number, current: boolean) => {
        await fetch('/api/admin/api-keys', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, is_active: !current }),
        });
        fetchKeys();
    };

    const deleteKey = async (id: number) => {
        if (!confirm('Delete this API key? This cannot be undone.')) return;
        await fetch(`/api/admin/api-keys?id=${id}`, { method: 'DELETE' });
        showToast('API key deleted', 'success');
        fetchKeys();
    };

    const formatDate = (d: string | null) => {
        if (!d) return 'Never';
        return new Date(d).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">API Keys</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Manage encrypted API keys for AI providers
                    </p>
                </div>
                <Button onClick={() => setShowAdd(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Add Key
                </Button>
            </div>

            {/* Security Notice */}
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-emerald-600 mt-0.5" />
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    API keys are encrypted with AES-256-GCM before storage. Only masked versions are displayed.
                </p>
            </div>

            {/* Add Key Form */}
            {showAdd && (
                <Card>
                    <CardContent className="p-4 space-y-3">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Add New API Key</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <select
                                value={newKey.provider_id}
                                onChange={(e) => setNewKey({ ...newKey, provider_id: e.target.value })}
                                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                                aria-label="Select provider"
                            >
                                <option value="">Select Provider</option>
                                {providers.map(p => (
                                    <option key={p.id} value={p.id}>{p.display_name}</option>
                                ))}
                            </select>
                            <Input
                                placeholder="Key Name (e.g. Production)"
                                value={newKey.key_name}
                                onChange={(e) => setNewKey({ ...newKey, key_name: e.target.value })}
                            />
                            <div className="relative">
                                <Input
                                    type={showApiKey ? 'text' : 'password'}
                                    placeholder="API Key (e.g. sk-...)"
                                    value={newKey.api_key}
                                    onChange={(e) => setNewKey({ ...newKey, api_key: e.target.value })}
                                />
                                <button
                                    type="button"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                                >
                                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" onClick={addKey}>Encrypt & Save</Button>
                            <Button size="sm" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Keys Table */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Provider</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Key</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Last Used</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {keys.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                                        <Key className="w-10 h-10 mx-auto mb-2 opacity-40" />
                                        <p>No API keys configured</p>
                                    </td>
                                </tr>
                            ) : (
                                keys.map(k => (
                                    <tr key={k.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-4 py-3">
                                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{k.provider_display_name}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">{k.key_name}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <code className="text-xs font-mono text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{k.masked_key}</code>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant={k.is_active ? 'success' : 'warning'} size="sm">
                                                {k.is_active ? 'Active' : 'Disabled'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                                            {formatDate(k.last_used_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => toggleKey(k.id, k.is_active)}
                                                    className={`p-1.5 rounded transition ${k.is_active ? 'text-green-500 hover:text-red-500' : 'text-red-500 hover:text-green-500'}`}
                                                    aria-label={k.is_active ? 'Disable key' : 'Enable key'}
                                                >
                                                    {k.is_active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => deleteKey(k.id)}
                                                    className="p-1.5 rounded text-gray-400 hover:text-red-500 transition"
                                                    aria-label="Delete key"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
