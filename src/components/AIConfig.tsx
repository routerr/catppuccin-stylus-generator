import { useState, useEffect } from 'react';
import { Brain, Key, Eye, EyeOff, Save, Trash2 } from 'lucide-react';
import { loadAPIKeys, saveAPIKeys, clearAPIKeys } from '../utils/storage';
import { getModelsByProvider } from '../services/ai';
import type { AIProvider } from '../types/theme';

interface AIConfigProps {
  aiProvider: AIProvider;
  onAIProviderChange: (provider: AIProvider) => void;
  aiModel: string;
  onAIModelChange: (model: string) => void;
  onKeyChange: (key: string) => void;
  ollamaModels?: string[];
  onModelsDiscovered?: (models: string[]) => void;
}

const AI_PROVIDERS: { value: AIProvider; label: string; description?: string }[] = [
  { value: 'openrouter', label: 'OpenRouter', description: '8+ free models available' },
  { value: 'chutes', label: 'Chutes AI', description: '5+ free models available' },
  { value: 'ollama', label: 'Ollama (Local)', description: 'No API key, runs on localhost' },
];

export function AIConfig({
  aiProvider,
  onAIProviderChange,
  aiModel,
  onAIModelChange,
  onKeyChange,
  ollamaModels,
  onModelsDiscovered,
}: AIConfigProps) {
  const [aiKey, setAIKey] = useState('');
  const [showAIKey, setShowAIKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [ollamaError, setOllamaError] = useState('');
  const [localOllamaModels, setLocalOllamaModels] = useState<string[]>([]);
  const [ollamaBase, setOllamaBase] = useState('');

  // Load saved keys on mount and provider change
  useEffect(() => {
    const keys = loadAPIKeys();
    setAIKey(keys[aiProvider] || '');
    setOllamaBase(keys.ollamaBase || '');
  }, [aiProvider]);

  // Notify parent of key changes
  useEffect(() => {
    onKeyChange(aiKey);
  }, [aiKey, onKeyChange]);

  // Combine defaults + discovered Ollama models
  const availableModels = getModelsByProvider(aiProvider);
  const modelsForRender = (() => {
    let list = availableModels;
    const allOllamaModels = [...(ollamaModels || []), ...localOllamaModels];
    if (aiProvider === 'ollama') {
      const discovered = allOllamaModels.map(id => ({ id, name: id, provider: 'ollama' as const, isFree: true }));
      const byId = new Map<string, typeof discovered[number]>();
      [...list, ...discovered].forEach(m => byId.set(m.id, m as any));
      list = Array.from(byId.values());
      if (aiModel && !list.some(m => m.id === aiModel)) {
        list.push({ id: aiModel, name: `Custom: ${aiModel}`, provider: 'ollama', isFree: true } as any);
      }
    } else if (aiModel && !list.some(m => m.id === aiModel)) {
      list = [...list, { id: aiModel, name: `Custom: ${aiModel}`, provider: aiProvider, isFree: true } as any];
    }
    return list;
  })();

  const handleSave = () => {
    const keys = loadAPIKeys();
    saveAPIKeys({
      ...keys,
      [aiProvider]: aiKey,
      ollamaBase,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    clearAPIKeys();
    setAIKey('');
    setOllamaBase('');
  };

  const testOllama = async () => {
    setOllamaStatus('testing');
    setOllamaError('');
    setLocalOllamaModels([]);

    const bases = [ollamaBase?.trim()].filter(Boolean) as string[];
    if (aiProvider === 'ollama' && aiKey) {
      bases.unshift('https://ollama.com');
    }
    bases.push('/ollama', 'http://localhost:11434');
    
    let lastErr: any = null;
    for (const base of bases) {
      try {
        const res = await fetch(`${base}/api/tags`, {
          method: 'GET',
          headers: base.startsWith('https://ollama.com') && aiKey ? { 'Authorization': `Bearer ${aiKey}` } : undefined,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const models: string[] = (data?.models || data?.tags || [])
          .map((m: any) => m?.name || m?.model)
          .filter(Boolean);
        setLocalOllamaModels(models);
        if (onModelsDiscovered) onModelsDiscovered(models);
        setOllamaStatus('ok');
        return;
      } catch (e) {
        lastErr = e;
      }
    }
    setOllamaStatus('error');
    setOllamaError(String(lastErr?.message || lastErr || 'Failed to connect'));
  };

  const handleProviderChange = (provider: AIProvider) => {
    onAIProviderChange(provider);
    // Pick first model for the newly selected provider
    let list = getModelsByProvider(provider);
    if (provider === 'ollama') {
      const allOllamaModels = [...(ollamaModels || []), ...localOllamaModels];
      const discovered = allOllamaModels.map(id => ({ id, name: id, provider: 'ollama' as const, isFree: true }));
      const byId = new Map<string, typeof discovered[number]>();
      [...list, ...discovered].forEach(m => byId.set(m.id, m as any));
      list = Array.from(byId.values());
    }
    if (list && list.length > 0) {
      onAIModelChange(list[0].id);
    }
  };

  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const keys = loadAPIKeys();
  const hasHttpsOllama = keys.ollamaBase?.startsWith('https://');
  const hasOllamaCloudKey = !!keys.ollama;

  return (
    <div className="space-y-6">
      {/* Header with Save/Clear */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-ctp-accent flex items-center gap-2">
          <Brain className="h-6 w-6" />
          AI Configuration
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-ctp-green to-ctp-teal hover:opacity-90 rounded-md text-sm transition-colors text-ctp-base font-medium"
          >
            <Save className="h-4 w-4" />
            {saved ? 'Saved!' : 'Save'}
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-3 py-1.5 bg-ctp-red hover:bg-ctp-red/80 rounded-md text-sm transition-colors text-ctp-base"
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </button>
        </div>
      </div>

      {/* AI Provider Selection */}
      <div>
        <label className="block text-sm font-medium text-ctp-subtext1 mb-3">
          AI Provider
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {AI_PROVIDERS.map((provider) => {
            const disabled = provider.value === 'ollama' && isHttps && !(hasHttpsOllama || hasOllamaCloudKey);
            return (
              <button
                key={provider.value}
                onClick={() => handleProviderChange(provider.value)}
                disabled={disabled}
                title={disabled ? 'On HTTPS, set a Custom Ollama URL or provide an Ollama Cloud API key.' : undefined}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  aiProvider === provider.value
                    ? 'border-ctp-accent bg-ctp-accent/10'
                    : disabled
                    ? 'border-ctp-surface2 bg-ctp-surface1/30 opacity-50 cursor-not-allowed'
                    : 'border-ctp-surface2 bg-ctp-surface1/30 hover:border-ctp-overlay0'
                }`}
              >
                <div className="font-semibold text-ctp-text">{provider.label}</div>
                {provider.description && (
                  <div className="text-sm text-ctp-subtext0 mt-1">{provider.description}</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Model Selection */}
      <div>
        <label htmlFor="ai-model" className="block text-sm font-medium text-ctp-subtext1 mb-2">
          AI Model
        </label>
        <select
          id="ai-model"
          value={aiModel}
          onChange={(e) => onAIModelChange(e.target.value)}
          className="block w-full px-3 py-2 border border-ctp-surface2 rounded-lg bg-ctp-surface1/50 text-ctp-text hover:border-ctp-surface2 focus:outline-none focus:ring-2 focus:ring-ctp-accent focus:border-transparent"
        >
          {modelsForRender.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-ctp-subtext0">
          {modelsForRender.find(m => m.id === aiModel)?.provider === 'ollama'
            ? 'Local model (Ollama)'
            : modelsForRender.find(m => m.id === aiModel)?.isFree
            ? 'Free tier (rate-limited)'
            : 'Paid model'}
        </p>
      </div>

      {/* API Key Input */}
      {aiProvider !== 'ollama' ? (
        <div>
          <label className="block text-sm font-medium text-ctp-subtext1 mb-2 flex items-center gap-2">
            <Key className="h-4 w-4" />
            {aiProvider === 'openrouter' ? 'OpenRouter API Key' : 'Chutes AI API Key'}
          </label>
          <div className="relative">
            <input
              type={showAIKey ? 'text' : 'password'}
              value={aiKey}
              onChange={(e) => setAIKey(e.target.value)}
              placeholder={`Enter your ${aiProvider === 'openrouter' ? 'OpenRouter' : 'Chutes'} API key`}
              className="block w-full pr-10 px-3 py-2 border border-ctp-surface2 rounded-lg bg-ctp-surface1/50 text-ctp-text placeholder-ctp-overlay0 focus:outline-none focus:ring-2 focus:ring-ctp-accent focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowAIKey(!showAIKey)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-ctp-overlay1 hover:text-ctp-text"
            >
              {showAIKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <p className="mt-2 text-xs text-ctp-subtext0">
            {aiProvider === 'openrouter' && (
              <>
                Get your API key at{' '}
                <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-ctp-lavender hover:text-ctp-mauve underline">
                  openrouter.ai/keys
                </a>
              </>
            )}
            {aiProvider === 'chutes' && (
              <>
                Get your API key at{' '}
                <a href="https://chutes.ai" target="_blank" rel="noopener noreferrer" className="text-ctp-lavender hover:text-ctp-mauve underline">
                  chutes.ai
                </a>
              </>
            )}
          </p>
          <div className="mt-2 bg-ctp-yellow/20 border border-ctp-yellow/30 rounded-lg p-3 text-sm text-ctp-yellow">
            <strong>Security:</strong> Your API key is stored locally and only sent to {aiProvider === 'openrouter' ? 'OpenRouter' : 'Chutes AI'}.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Ollama Local Info */}
          <div className="bg-ctp-green/20 border border-ctp-green/30 rounded-lg p-3 text-sm text-ctp-green">
            <strong>No API key required:</strong> Ollama runs locally at http://localhost:11434.
          </div>

          {/* Test Ollama Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={testOllama}
              className="px-3 py-1.5 bg-ctp-green hover:bg-ctp-green/80 rounded-md text-sm text-ctp-base font-medium"
            >
              {ollamaStatus === 'testing' ? 'Testing…' : 'Test Ollama & List Models'}
            </button>
            {ollamaStatus === 'ok' && <span className="text-ctp-green text-sm">✓ Connected</span>}
            {ollamaStatus === 'error' && <span className="text-ctp-red text-sm">✗ {ollamaError}</span>}
          </div>

          {/* Discovered Models */}
          {localOllamaModels.length > 0 && (
            <div>
              <div className="text-ctp-subtext1 text-sm mb-2">Installed models (click to use):</div>
              <div className="flex flex-wrap gap-2">
                {localOllamaModels.map((m) => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => onAIModelChange(m)}
                    className={`px-2.5 py-1 rounded-md border text-xs transition-colors ${
                      aiModel === m
                        ? 'border-ctp-accent bg-ctp-accent/20 text-ctp-accent'
                        : 'border-ctp-surface2 bg-ctp-surface0/60 text-ctp-text hover:border-ctp-accent hover:text-ctp-accent'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Ollama Cloud API Key (optional) */}
          <div>
            <label className="block text-sm font-medium text-ctp-subtext1 mb-2 flex items-center gap-2">
              <Key className="h-4 w-4" />
              Ollama Cloud API Key (optional)
            </label>
            <div className="relative">
              <input
                type={showAIKey ? 'text' : 'password'}
                value={aiKey}
                onChange={(e) => setAIKey(e.target.value)}
                placeholder="Enter your Ollama Cloud API key"
                className="block w-full pr-10 px-3 py-2 border border-ctp-surface2 rounded-lg bg-ctp-surface1/50 text-ctp-text placeholder-ctp-overlay0 focus:outline-none focus:ring-2 focus:ring-ctp-accent focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowAIKey(!showAIKey)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-ctp-overlay1 hover:text-ctp-text"
              >
                {showAIKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-ctp-subtext0">
              Get your API key at{' '}
              <a href="https://ollama.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-ctp-lavender hover:text-ctp-mauve underline">
                ollama.com/settings/keys
              </a>
            </p>
          </div>

          {/* Custom Ollama URL */}
          <div>
            <label className="block text-sm font-medium text-ctp-subtext1 mb-2">
              Custom Ollama URL (for HTTPS sites)
            </label>
            <input
              type="text"
              value={ollamaBase}
              onChange={(e) => setOllamaBase(e.target.value)}
              placeholder="e.g., https://your-tunnel.example.com"
              className="block w-full px-3 py-2 border border-ctp-surface2 rounded-lg bg-ctp-surface1/50 text-ctp-text placeholder-ctp-overlay0 focus:outline-none focus:ring-2 focus:ring-ctp-accent focus:border-transparent"
            />
            <p className="mt-1 text-xs text-ctp-subtext0">
              On HTTPS sites, direct access to http://localhost is blocked. Use an HTTPS tunnel (ngrok/Cloudflare).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
