import { Brain } from 'lucide-react';
import type { AIProvider } from '../types/theme';
import { getModelsByProvider } from '../services/ai';
import { loadAPIKeys } from '../utils/storage';

interface ServiceSelectorProps {
  aiProvider: AIProvider;
  onAIProviderChange: (provider: AIProvider) => void;
  aiModel: string;
  onAIModelChange: (model: string) => void;
  ollamaModels?: string[];
}

const AI_PROVIDERS: { value: AIProvider; label: string; description?: string }[] = [
  { value: 'openrouter', label: 'OpenRouter', description: '8+ free models available' },
  { value: 'chutes', label: 'Chutes AI', description: '5+ free models available' },
  { value: 'ollama', label: 'Ollama (Local)', description: 'No API key, runs on localhost' },
];

export function ServiceSelector({
  aiProvider,
  onAIProviderChange,
  aiModel,
  onAIModelChange,
  ollamaModels,
}: ServiceSelectorProps) {
  const availableModels = getModelsByProvider(aiProvider);
  // Combine defaults + discovered Ollama models and ensure current selection is present
  const modelsForRender = (() => {
    let list = availableModels;
    if (aiProvider === 'ollama') {
      const discovered = (ollamaModels || []).map(id => ({ id, name: id, provider: 'ollama' as const, isFree: true }));
      // merge & dedupe by id
      const byId = new Map<string, typeof discovered[number]>();
      [...list, ...discovered].forEach(m => byId.set(m.id, m as any));
      list = Array.from(byId.values());
      // Ensure current selection exists
      if (aiModel && !list.some(m => m.id === aiModel)) {
        list.push({ id: aiModel, name: `Custom: ${aiModel}`, provider: 'ollama', isFree: true } as any);
      }
    } else if (aiModel && !list.some(m => m.id === aiModel)) {
      // Non-ollama safety: ensure current selection is visible if external logic set it
      list = [...list, { id: aiModel, name: `Custom: ${aiModel}`, provider: aiProvider, isFree: true } as any];
    }
    return list;
  })();

  return (
    <div className="space-y-6">
      {/* Info Box */}
      <div className="bg-ctp-blue/20 border border-ctp-blue/30 rounded-lg p-4 text-sm text-ctp-blue">
        <strong>URL Crawling:</strong> Paste a URL and we&apos;ll fetch it via our HTTP proxy or the Playwright crawler if you configure it in the API Key section.
      </div>

      {/* AI Provider Selection */}
      <div>
        <label className="block text-sm font-medium text-ctp-subtext1 mb-3 flex items-center gap-2">
          <Brain className="h-4 w-4" />
          AI Provider
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {AI_PROVIDERS.map((provider) => {
            const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
            const keys = loadAPIKeys();
            const hasHttpsOllama = keys.ollamaBase?.startsWith('https://');
            const hasOllamaCloudKey = !!keys.ollama;
            const disabled = provider.value === 'ollama' && isHttps && !(hasHttpsOllama || hasOllamaCloudKey);
            return (
            <button
              key={provider.value}
              onClick={() => {
                // Change provider
                onAIProviderChange(provider.value);
                // Pick first model for the newly selected provider
                let list = getModelsByProvider(provider.value);
                if (provider.value === 'ollama') {
                  const discovered = (ollamaModels || []).map(id => ({ id, name: id, provider: 'ollama' as const, isFree: true }));
                  const byId = new Map<string, typeof discovered[number]>();
                  [...list, ...discovered].forEach(m => byId.set(m.id, m as any));
                  list = Array.from(byId.values());
                }
                if (list && list.length > 0) {
                  onAIModelChange(list[0].id);
                }
              }}
              disabled={disabled}
              title={disabled ? 'On HTTPS, set a Custom Ollama URL or provide an Ollama Cloud API key in the API Key section.' : undefined}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                aiProvider === provider.value
                  ? 'border-ctp-accent bg-ctp-accent/10'
                  : (disabled ? 'border-ctp-surface2 bg-ctp-surface1/30 opacity-50 cursor-not-allowed' : 'border-ctp-surface2 bg-ctp-surface1/30 hover:border-ctp-overlay0')
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
        {/* HTTPS notice */}
        {(() => {
          const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
          const keys = loadAPIKeys();
          const hasHttpsOllama = keys.ollamaBase?.startsWith('https://');
          if (isHttps && !hasHttpsOllama) {
            return (
              <div className="mt-2 text-xs text-ctp-yellow">
                To use Ollama on GitHub Pages (HTTPS), set a custom HTTPS Ollama URL in API Key Configuration.
              </div>
            );
          }
          return null;
        })()}
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
          className="block w-full px-3 py-2 border border-ctp-surface2 rounded-lg bg-ctp-surface1/50 text-ctp-text hover:border-ctp-surface2 hover:shadow-none focus:outline-none focus:ring-2 focus:ring-ctp-accent focus:border-transparent"
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
            : (modelsForRender.find(m => m.id === aiModel)?.isFree ? 'Free tier (rate-limited)' : 'Paid model')}
        </p>
      </div>
    </div>
  );
}
