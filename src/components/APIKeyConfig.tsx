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
  const [aiKey, setAIKey] = useState('');
  const [showAIKey, setShowAIKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<'idle'|'testing'|'ok'|'error'>('idle');
  const [ollamaError, setOllamaError] = useState('');
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);

  useEffect(() => {
    // Load saved keys
    const keys = loadAPIKeys();
    setAIKey(keys[aiProvider] || '');
  }, [aiProvider]);

  useEffect(() => {
    // Notify parent of key changes
    onKeyChange(aiKey);
  }, [aiKey, onKeyChange]);

  const handleSave = () => {
    const keys = loadAPIKeys();
    saveAPIKeys({
      ...keys,
      [aiProvider]: aiKey,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    clearAPIKeys();
    setAIKey('');
  };

  const testOllama = async () => {
    setOllamaStatus('testing');
    setOllamaError('');
    setOllamaModels([]);

    const bases = ['/ollama', 'http://localhost:11434'];
    let lastErr: any = null;
    for (const base of bases) {
      try {
        const res = await fetch(`${base}/api/tags`, { method: 'GET' });
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

      {/* AI Provider API Key */}
      {aiProvider !== 'ollama' ? (
        <div>
          <label className="block text-sm font-medium text-ctp-subtext1 mb-2">
            {aiProvider === 'openrouter' ? 'OpenRouter' : 'Chutes AI'} API Key
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
            Get your free API key at{' '}
            <a
              href={aiProvider === 'openrouter' ? 'https://openrouter.ai/keys' : 'https://chutes.ai'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ctp-lavender hover:text-ctp-mauve underline transition-colors"
            >
              {aiProvider === 'openrouter' ? 'openrouter.ai/keys' : 'chutes.ai'}
            </a>
          </p>
        </div>
      ) : null}
    </div>
  );
}
