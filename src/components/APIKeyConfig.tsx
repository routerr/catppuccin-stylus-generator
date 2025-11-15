import { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Save, Trash2 } from 'lucide-react';
import { loadAPIKeys, saveAPIKeys, clearAPIKeys } from '../utils/storage';
import type { AIProvider } from '../types/theme';

interface APIKeyConfigProps {
  aiProvider: AIProvider;
  onKeyChange: (key: string) => void;
  onPickModel?: (modelId: string) => void;
  onModelsDiscovered?: (models: string[]) => void;
}

export function APIKeyConfig({ aiProvider, onKeyChange, onPickModel, onModelsDiscovered }: APIKeyConfigProps) {
  const DEFAULT_CRAWLER_ENDPOINT = 'http://localhost:8787/crawl';
  const [aiKey, setAIKey] = useState('');
  const [showAIKey, setShowAIKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<'idle'|'testing'|'ok'|'error'>('idle');
  const [ollamaError, setOllamaError] = useState('');
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [ollamaBase, setOllamaBase] = useState('');
  const [playwrightEndpoint, setPlaywrightEndpoint] = useState(DEFAULT_CRAWLER_ENDPOINT);
  const [playwrightKey, setPlaywrightKey] = useState('');
  const [playwrightStatus, setPlaywrightStatus] = useState<'idle'|'testing'|'ok'|'fallback'|'error'>('idle');
  const [playwrightLastTest, setPlaywrightLastTest] = useState<string | null>(null);

  useEffect(() => {
    // Load saved keys
    const keys = loadAPIKeys();
    setAIKey(keys[aiProvider] || '');
    setOllamaBase(keys.ollamaBase || '');
    setPlaywrightEndpoint(keys.playwrightEndpoint || DEFAULT_CRAWLER_ENDPOINT);
    setPlaywrightKey(keys.playwrightKey || '');
  }, [aiProvider]);

  useEffect(() => {
    // Notify parent of key changes
    onKeyChange(aiKey);
  }, [aiKey, onKeyChange]);

  useEffect(() => {
    const keys = loadAPIKeys();
    if (keys.playwrightEndpoint === playwrightEndpoint && keys.playwrightKey === playwrightKey) return;
    saveAPIKeys({
      ...keys,
      playwrightEndpoint,
      playwrightKey,
    });
  }, [playwrightEndpoint, playwrightKey]);

  const handleSave = () => {
    const keys = loadAPIKeys();
    saveAPIKeys({
      ...keys,
      [aiProvider]: aiKey,
      ollamaBase,
      playwrightEndpoint,
      playwrightKey,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    clearAPIKeys();
    setAIKey('');
    setOllamaBase('');
    setPlaywrightEndpoint(DEFAULT_CRAWLER_ENDPOINT);
    setPlaywrightKey('');
    setPlaywrightStatus('idle');
    setPlaywrightLastTest(null);
  };

  const testOllama = async () => {
    setOllamaStatus('testing');
    setOllamaError('');
    setOllamaModels([]);

    const bases = [ollamaBase?.trim()].filter(Boolean) as string[];
    // If cloud key is present and provider is ollama, try cloud host too
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
        setOllamaModels(models);
        if (onModelsDiscovered) onModelsDiscovered(models);
        setOllamaStatus('ok');
        return;
      } catch (e) {
        lastErr = e;
        // try next base
      }
    }
    setOllamaStatus('error');
    setOllamaError(String(lastErr?.message || lastErr || 'Failed to connect'));
  };

  const testPlaywright = async () => {
    if (!playwrightEndpoint.trim()) return;
    setPlaywrightStatus('testing');
    const controller = (AbortController as any)?.timeout ? (AbortController as any).timeout(10000) : new AbortController();
    try {
      const res = await fetch(playwrightEndpoint.trim(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(playwrightKey.trim() ? { Authorization: `Bearer ${playwrightKey.trim()}` } : {}),
        },
        body: JSON.stringify({ url: 'https://example.com' }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const message = data?.error ? `${data.error}` : `HTTP ${res.status}`;
        throw new Error(message);
      }
      setPlaywrightStatus('ok');
      setPlaywrightLastTest(new Date().toLocaleTimeString());
    } catch (e) {
      console.warn('Playwright test failed', e);
      setPlaywrightStatus('fallback');
      setPlaywrightLastTest(new Date().toLocaleTimeString());
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-ctp-text flex items-center gap-2">
          <Key className="h-5 w-5" />
          API Key Configuration
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-ctp-green to-ctp-teal hover:opacity-90 rounded-md text-sm transition-colors text-ctp-base font-medium"
          >
            <Save className="h-4 w-4" />
            {saved ? 'Saved!' : 'Save Key'}
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

      {aiProvider !== 'ollama' ? (
        <div className="bg-ctp-yellow/20 border border-ctp-yellow/30 rounded-lg p-3 text-sm text-ctp-yellow">
          <strong>Security Note:</strong> Your API key is stored locally in your browser and only sent to {aiProvider === 'openrouter' ? 'OpenRouter' : 'Chutes AI'}.
        </div>
      ) : (
        <div className="bg-ctp-green/20 border border-ctp-green/30 rounded-lg p-3 text-sm text-ctp-green space-y-3">
          <div>
            <strong>No API key required:</strong> Ollama runs locally at http://localhost:11434.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={testOllama}
              className="px-3 py-1.5 bg-ctp-green hover:bg-ctp-green/80 rounded-md text-sm text-ctp-base font-medium"
            >
              {ollamaStatus === 'testing' ? 'Testing…' : 'Test Ollama & List Models'}
            </button>
            {ollamaStatus === 'ok' && (
              <span className="text-ctp-green">Connected</span>
            )}
            {ollamaStatus === 'error' && (
              <span className="text-ctp-red">Failed: {ollamaError}</span>
            )}
          </div>
          {ollamaModels.length > 0 && (
            <div>
              <div className="text-ctp-subtext1 text-sm mb-1">Installed models:</div>
              <div className="flex flex-wrap gap-2">
                {ollamaModels.map((m) => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => onPickModel && onPickModel(m)}
                    className="px-2.5 py-1 rounded-md border border-ctp-surface2 bg-ctp-surface0/60 text-ctp-text text-xs hover:border-ctp-accent hover:text-ctp-accent transition-colors"
                    title={onPickModel ? 'Click to use this model' : m}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Provider API Key (includes Ollama Cloud) */}
      <div>
        <label className="block text-sm font-medium text-ctp-subtext1 mb-2">
          {aiProvider === 'openrouter'
            ? 'OpenRouter API Key'
            : aiProvider === 'chutes'
            ? 'Chutes AI API Key'
            : 'Ollama Cloud API Key'}
        </label>
        <div className="relative">
          <input
            type={showAIKey ? 'text' : 'password'}
            value={aiKey}
            onChange={(e) => setAIKey(e.target.value)}
            placeholder={`Enter your ${aiProvider === 'openrouter' ? 'OpenRouter' : aiProvider === 'chutes' ? 'Chutes' : 'Ollama Cloud'} API key`}
            className="block w-full pr-10 px-3 py-2 border border-ctp-surface2 rounded-lg bg-ctp-surface1/50 text-ctp-text placeholder-ctp-overlay0 hover:border-ctp-surface2 hover:shadow-none focus:outline-none focus:ring-2 focus:ring-ctp-accent focus:border-transparent"
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
              <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-ctp-lavender hover:text-ctp-mauve underline transition-colors">openrouter.ai/keys</a>
            </>
          )}
          {aiProvider === 'chutes' && (
            <>
              Get your API key at{' '}
              <a href="https://chutes.ai" target="_blank" rel="noopener noreferrer" className="text-ctp-lavender hover:text-ctp-mauve underline transition-colors">chutes.ai</a>
            </>
          )}
          {aiProvider === 'ollama' && (
            <>
              Get your API key at{' '}
              <a href="https://ollama.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-ctp-lavender hover:text-ctp-mauve underline transition-colors">ollama.com/settings/keys</a>
            </>
          )}
        </p>
      </div>

      {/* Playwright crawler setup */}
      <div className="mt-6 space-y-3 border-t border-ctp-surface2 pt-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-ctp-subtext1">Playwright Crawler (Optional)</h4>
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`px-2 py-1 rounded-full border ${
                playwrightStatus === 'ok'
                  ? 'border-ctp-green text-ctp-green'
                  : playwrightStatus === 'testing'
                  ? 'border-ctp-yellow text-ctp-yellow'
                  : playwrightStatus === 'fallback'
                  ? 'border-ctp-yellow text-ctp-yellow'
                  : playwrightStatus === 'error'
                  ? 'border-ctp-red text-ctp-red'
                  : 'border-ctp-surface2 text-ctp-subtext0'
              }`}
            >
              {playwrightStatus === 'ok'
                ? 'Connected'
                : playwrightStatus === 'testing'
                ? 'Testing...'
                : playwrightStatus === 'fallback'
                ? 'Fallback (HTTP fetch)'
                : playwrightStatus === 'error'
                ? 'Error'
                : 'Idle'}
            </span>
            {playwrightLastTest && <span className="text-ctp-subtext0">Last test: {playwrightLastTest}</span>}
          </div>
        </div>
        <p className="text-xs text-ctp-subtext0">
          Run the bundled Playwright microservice with <code className="px-1 py-0.5 bg-ctp-surface1 rounded text-ctp-text">npm run crawler:serve</code> and expose it through a secure tunnel
          or localhost. Paste the endpoint (e.g. <code className="px-1 py-0.5 bg-ctp-surface1 rounded text-ctp-text">http://localhost:8787/crawl</code>) here. You can also set a bearer token
          to require authentication.
        </p>
        <div className="space-y-2">
          <label className="block text-xs font-medium text-ctp-subtext1">Crawler Endpoint</label>
          <input
            type="text"
            value={playwrightEndpoint}
            onChange={(e) => setPlaywrightEndpoint(e.target.value)}
            placeholder="http://localhost:8787/crawl"
            className="block w-full px-3 py-2 border border-ctp-surface2 rounded-lg bg-ctp-surface1/50 text-ctp-text placeholder-ctp-overlay0 focus:outline-none focus:ring-2 focus:ring-ctp-accent focus:border-transparent"
          />
          {playwrightEndpoint === DEFAULT_CRAWLER_ENDPOINT && (
            <p className="text-[11px] text-ctp-overlay1">Defaulting to local Playwright microservice at http://localhost:8787/crawl</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={testPlaywright}
            className="px-3 py-1.5 rounded-md border border-ctp-accent text-ctp-accent text-xs hover:bg-ctp-accent/10"
          >
            Test Playwright endpoint
          </button>
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-medium text-ctp-subtext1">Crawler API Key (optional)</label>
          <input
            type="text"
            value={playwrightKey}
            onChange={(e) => setPlaywrightKey(e.target.value)}
            placeholder="Bearer token for crawler server"
            className="block w-full px-3 py-2 border border-ctp-surface2 rounded-lg bg-ctp-surface1/50 text-ctp-text placeholder-ctp-overlay0 focus:outline-none focus:ring-2 focus:ring-ctp-accent focus:border-transparent"
          />
        </div>
        <p className="text-xs text-ctp-subtext0">
          When configured, the app will use Playwright for every URL crawl, capturing computed styles and client-rendered content before falling back to HTTP proxy fetching.
        </p>
      </div>

      {/* Ollama base URL (when provider is ollama) */}
      {aiProvider === 'ollama' ? (
        <div>
          <label className="block text-sm font-medium text-ctp-subtext1 mb-2">Custom Ollama URL (HTTPS recommended)</label>
          <input
            type="text"
            value={ollamaBase}
            onChange={(e) => setOllamaBase(e.target.value)}
            placeholder="e.g., https://your-tunnel.example.com"
            className="block w-full px-3 py-2 border border-ctp-surface2 rounded-lg bg-ctp-surface1/50 text-ctp-text placeholder-ctp-overlay0 hover:border-ctp-surface2 hover:shadow-none focus:outline-none focus:ring-ctp-accent"
          />
          <p className="mt-2 text-xs text-ctp-subtext0">
            On GitHub Pages (HTTPS), direct access to http://localhost is blocked. Use an HTTPS tunnel (ngrok/Cloudflare) or a proxy.
          </p>
        </div>
      ) : null}
    </div>
  );
}
