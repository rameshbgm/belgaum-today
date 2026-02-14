'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Bot, Plus, Trash2, Star, StarOff, Power, PowerOff,
    ChevronDown, ChevronUp, Cpu, Settings, Loader2
} from 'lucide-react';
import { Button, Card, CardContent, Badge, Input, useToast } from '@/components/ui';

interface Provider {
    id: number;
    name: string;
    display_name: string;
    base_url: string;
    api_format: string;
    is_active: boolean;
    is_default: boolean;
    model_count: number;
    key_count: number;
}

interface Model {
    id: number;
    provider_id: number;
    model_id: string;
    display_name: string;
    is_active: boolean;
    is_default: boolean;
    max_tokens: number;
    temperature: number;
    provider_name: string;
    provider_display_name: string;
}

export default function AIAgentsPage() {
    const { showToast } = useToast();
    const [providers, setProviders] = useState<Provider[]>([]);
    const [models, setModels] = useState<Model[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedProvider, setExpandedProvider] = useState<number | null>(null);
    const [showAddProvider, setShowAddProvider] = useState(false);
    const [showAddModel, setShowAddModel] = useState<number | null>(null);
    const [newProvider, setNewProvider] = useState({ display_name: '', base_url: '', api_format: 'openai' });
    const [newModel, setNewModel] = useState({ model_id: '', display_name: '', max_tokens: 1000, temperature: 0.3 });

    const fetchProviders = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/providers');
            const data = await res.json();
            if (data.success) setProviders(data.data);
        } catch { /* ignore */ }
    }, []);

    const fetchModels = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/models');
            const data = await res.json();
            if (data.success) setModels(data.data);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        Promise.all([fetchProviders(), fetchModels()]).finally(() => setLoading(false));
    }, [fetchProviders, fetchModels]);

    const toggleDefault = async (providerId: number) => {
        await fetch('/api/admin/providers', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: providerId, is_default: true }),
        });
        showToast('Default provider updated', 'success');
        fetchProviders();
    };

    const toggleActive = async (providerId: number, current: boolean) => {
        await fetch('/api/admin/providers', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: providerId, is_active: !current }),
        });
        showToast(`Provider ${current ? 'disabled' : 'enabled'}`, 'success');
        fetchProviders();
    };

    const deleteProvider = async (id: number) => {
        if (!confirm('Delete this provider and all its models/keys?')) return;
        await fetch(`/api/admin/providers?id=${id}`, { method: 'DELETE' });
        showToast('Provider deleted', 'success');
        fetchProviders();
        fetchModels();
    };

    const addProvider = async () => {
        if (!newProvider.display_name) return showToast('Name is required', 'error');
        const res = await fetch('/api/admin/providers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: newProvider.display_name.toLowerCase().replace(/\s+/g, '_'),
                ...newProvider,
            }),
        });
        const data = await res.json();
        if (data.success) {
            showToast('Provider added', 'success');
            setShowAddProvider(false);
            setNewProvider({ display_name: '', base_url: '', api_format: 'openai' });
            fetchProviders();
        } else {
            showToast(data.error || 'Failed', 'error');
        }
    };

    const toggleModelDefault = async (modelId: number) => {
        await fetch('/api/admin/models', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: modelId, is_default: true }),
        });
        showToast('Default model updated', 'success');
        fetchModels();
    };

    const toggleModelActive = async (modelId: number, current: boolean) => {
        await fetch('/api/admin/models', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: modelId, is_active: !current }),
        });
        fetchModels();
    };

    const deleteModel = async (id: number) => {
        if (!confirm('Delete this model?')) return;
        await fetch(`/api/admin/models?id=${id}`, { method: 'DELETE' });
        showToast('Model deleted', 'success');
        fetchModels();
        fetchProviders();
    };

    const addModel = async (providerId: number) => {
        if (!newModel.model_id || !newModel.display_name) {
            return showToast('Model ID and display name are required', 'error');
        }
        const res = await fetch('/api/admin/models', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider_id: providerId, ...newModel }),
        });
        const data = await res.json();
        if (data.success) {
            showToast('Model added', 'success');
            setShowAddModel(null);
            setNewModel({ model_id: '', display_name: '', max_tokens: 1000, temperature: 0.3 });
            fetchModels();
            fetchProviders();
        } else {
            showToast(data.error || 'Failed', 'error');
        }
    };

    const providerModels = (providerId: number) => models.filter(m => m.provider_id === providerId);

    const apiFormatLabel: Record<string, string> = {
        openai: 'OpenAI-compatible',
        anthropic: 'Anthropic',
        gemini: 'Google Gemini',
        custom: 'Custom',
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    const defaultProvider = providers.find(p => p.is_default);
    const defaultModel = defaultProvider ? models.find(m => m.provider_id === defaultProvider.id && m.is_default) : null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Agents</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Manage LLM providers and models for news analysis
                    </p>
                </div>
                <Button onClick={() => setShowAddProvider(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Add Provider
                </Button>
            </div>

            {/* Active Agent Banner */}
            {defaultProvider && (
                <Card className="border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/20">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                            <Bot className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100">Active Agent</p>
                            <p className="text-xs text-indigo-700 dark:text-indigo-300">
                                {defaultProvider.display_name} → {defaultModel?.display_name || 'No default model'}
                                {defaultProvider.key_count === 0 && (
                                    <span className="text-red-500 ml-2">⚠ No API key configured</span>
                                )}
                            </p>
                        </div>
                        <Badge variant={defaultProvider.key_count > 0 ? 'success' : 'warning'}>
                            {defaultProvider.key_count > 0 ? 'Ready' : 'Need API Key'}
                        </Badge>
                    </CardContent>
                </Card>
            )}

            {/* Add Provider Form */}
            {showAddProvider && (
                <Card>
                    <CardContent className="p-4 space-y-3">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Add New Provider</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Input
                                placeholder="Display Name (e.g. Llama)"
                                value={newProvider.display_name}
                                onChange={(e) => setNewProvider({ ...newProvider, display_name: e.target.value })}
                            />
                            <Input
                                placeholder="Base URL (e.g. https://api.example.com/v1)"
                                value={newProvider.base_url}
                                onChange={(e) => setNewProvider({ ...newProvider, base_url: e.target.value })}
                            />
                            <select
                                value={newProvider.api_format}
                                onChange={(e) => setNewProvider({ ...newProvider, api_format: e.target.value })}
                                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                                aria-label="API format"
                            >
                                <option value="openai">OpenAI-compatible</option>
                                <option value="anthropic">Anthropic</option>
                                <option value="gemini">Google Gemini</option>
                                <option value="custom">Custom</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" onClick={addProvider}>Add Provider</Button>
                            <Button size="sm" variant="outline" onClick={() => setShowAddProvider(false)}>Cancel</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Provider Cards */}
            {providers.map(provider => {
                const pModels = providerModels(provider.id);
                const isExpanded = expandedProvider === provider.id;

                return (
                    <Card key={provider.id} className={provider.is_default ? 'ring-2 ring-indigo-400' : ''}>
                        <CardContent className="p-0">
                            {/* Provider Header */}
                            <div
                                className="p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                                onClick={() => setExpandedProvider(isExpanded ? null : provider.id)}
                            >
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                                    <Cpu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-900 dark:text-white">{provider.display_name}</span>
                                        {provider.is_default && <Badge variant="info" size="sm">Default</Badge>}
                                        {!provider.is_active && <Badge variant="warning" size="sm">Disabled</Badge>}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        {apiFormatLabel[provider.api_format]} · {provider.model_count} model{provider.model_count !== 1 ? 's' : ''} · {provider.key_count} key{provider.key_count !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleDefault(provider.id); }}
                                        className={`p-1.5 rounded-lg transition ${provider.is_default ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
                                        title="Set as default"
                                        aria-label="Set as default provider"
                                    >
                                        {provider.is_default ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleActive(provider.id, provider.is_active); }}
                                        className={`p-1.5 rounded-lg transition ${provider.is_active ? 'text-green-500 hover:text-red-500' : 'text-red-500 hover:text-green-500'}`}
                                        title={provider.is_active ? 'Disable' : 'Enable'}
                                        aria-label={`${provider.is_active ? 'Disable' : 'Enable'} provider`}
                                    >
                                        {provider.is_active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteProvider(provider.id); }}
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 transition"
                                        title="Delete provider"
                                        aria-label="Delete provider"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                </div>
                            </div>

                            {/* Expanded Models */}
                            {isExpanded && (
                                <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50/50 dark:bg-gray-800/30">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Models</h4>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setShowAddModel(showAddModel === provider.id ? null : provider.id)}
                                        >
                                            <Plus className="w-3 h-3 mr-1" /> Add Model
                                        </Button>
                                    </div>

                                    {/* Add Model Form */}
                                    {showAddModel === provider.id && (
                                        <div className="mb-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2">
                                            <div className="grid grid-cols-2 gap-2">
                                                <Input
                                                    placeholder="Model ID (e.g. gpt-4o)"
                                                    value={newModel.model_id}
                                                    onChange={(e) => setNewModel({ ...newModel, model_id: e.target.value })}
                                                />
                                                <Input
                                                    placeholder="Display Name (e.g. GPT-4o)"
                                                    value={newModel.display_name}
                                                    onChange={(e) => setNewModel({ ...newModel, display_name: e.target.value })}
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="sm" onClick={() => addModel(provider.id)}>Add</Button>
                                                <Button size="sm" variant="outline" onClick={() => setShowAddModel(null)}>Cancel</Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Model List */}
                                    {pModels.length === 0 ? (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">No models configured.</p>
                                    ) : (
                                        <div className="space-y-1">
                                            {pModels.map(model => (
                                                <div
                                                    key={model.id}
                                                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Settings className="w-4 h-4 text-gray-400" />
                                                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{model.display_name}</span>
                                                        <span className="text-xs text-gray-400 font-mono">{model.model_id}</span>
                                                        {model.is_default && <Badge variant="info" size="sm">Default</Badge>}
                                                        {!model.is_active && <Badge variant="warning" size="sm">Off</Badge>}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => toggleModelDefault(model.id)}
                                                            className={`p-1 rounded transition ${model.is_default ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
                                                            aria-label="Set as default model"
                                                        >
                                                            {model.is_default ? <Star className="w-3.5 h-3.5 fill-current" /> : <StarOff className="w-3.5 h-3.5" />}
                                                        </button>
                                                        <button
                                                            onClick={() => toggleModelActive(model.id, model.is_active)}
                                                            className={`p-1 rounded transition ${model.is_active ? 'text-green-500' : 'text-red-500'}`}
                                                            aria-label={`${model.is_active ? 'Disable' : 'Enable'} model`}
                                                        >
                                                            {model.is_active ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
                                                        </button>
                                                        <button
                                                            onClick={() => deleteModel(model.id)}
                                                            className="p-1 rounded text-gray-400 hover:text-red-500 transition"
                                                            aria-label="Delete model"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );
            })}

            {providers.length === 0 && !showAddProvider && (
                <Card>
                    <CardContent className="py-12 text-center text-gray-500 dark:text-gray-400">
                        <Bot className="w-12 h-12 mx-auto mb-3 opacity-40" />
                        <p>No AI providers configured.</p>
                        <Button size="sm" className="mt-3" onClick={() => setShowAddProvider(true)}>
                            Add Your First Provider
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
