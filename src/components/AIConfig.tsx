import { useEffect, useMemo, useState } from 'react';
import { Brain, Key, Eye, EyeOff, Save, Trash2 } from 'lucide-react';
import { loadAPIKeys, saveAPIKeys, clearAPIKeys } from '../utils/storage';
import { useLanguage } from '../hooks/useLanguage';
import { discoverModels, getModelsByProvider } from '../services/ai';
import {
  DEFAULT_OPENAI_COMPATIBLE_BASE,
  DEFAULT_OLLAMA_CLOUD_BASE,
  formatModelPrice,
  getProviderBaseUrl,
  sortModelsByPrice,
} from '../services/ai/model-catalog';
import type { AIModel, AIProvider } from '../types/theme';

interface AIConfigProps {
  aiProvider: AIProvider;
  onAIProviderChange: (provider: AIProvider) => void;
  aiModel: string;
  onAIModelChange: (model: string) => void;
  onKeyChange: (key: string) => void;
  onBaseUrlChange: (baseUrl: string) => void;
}

const AI_PROVIDERS: { value: AIProvider; label: string; description?: string }[] = [
  { value: 'openrouter', label: 'OpenRouter', description: 'Catalog + pricing from API' },
  { value: 'openai-compatible', label: 'OpenAI-Compatible', description: 'Custom /v1 endpoint support' },
  { value: 'ollama', label: 'Ollama Cloud', description: 'Cloud API only (no localhost dependency)' },
];

function providerLabel(provider: AIProvider): string {
  switch (provider) {
    case 'openrouter':
      return 'OpenRouter';
    case 'openai-compatible':
      return 'OpenAI-compatible provider';
    case 'ollama':
      return 'Ollama Cloud';
    default:
      return provider;
  }
}

function dedupeById(models: AIModel[]): AIModel[] {
  const byId = new Map<string, AIModel>();
  models.forEach((model) => byId.set(model.id, model));
  return Array.from(byId.values());
}

function isValidAbsoluteHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function AIConfig({
  aiProvider,
  onAIProviderChange,
  aiModel,
  onAIModelChange,
  onKeyChange,
  onBaseUrlChange,
}: AIConfigProps) {
  const { t } = useLanguage();
  const [aiKey, setAIKey] = useState('');
  const [showAIKey, setShowAIKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [openaiCompatibleBase, setOpenaiCompatibleBase] = useState(DEFAULT_OPENAI_COMPATIBLE_BASE);
  const [ollamaBase, setOllamaBase] = useState(DEFAULT_OLLAMA_CLOUD_BASE);
  const [remoteModels, setRemoteModels] = useState<AIModel[]>([]);
  const [modelLoadStatus, setModelLoadStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [modelLoadError, setModelLoadError] = useState('');

  useEffect(() => {
    const keys = loadAPIKeys();
    setAIKey(keys[aiProvider] || '');
    setOpenaiCompatibleBase(keys.openaiCompatibleBase || DEFAULT_OPENAI_COMPATIBLE_BASE);
    setOllamaBase(keys.ollamaBase || DEFAULT_OLLAMA_CLOUD_BASE);
  }, [aiProvider]);

  useEffect(() => {
    onKeyChange(aiKey);
  }, [aiKey, onKeyChange]);

  const currentProviderBase = useMemo(() => {
    if (aiProvider === 'openai-compatible') return openaiCompatibleBase;
    if (aiProvider === 'ollama') return ollamaBase;
    return '';
  }, [aiProvider, openaiCompatibleBase, ollamaBase]);

  useEffect(() => {
    onBaseUrlChange(getProviderBaseUrl(aiProvider, currentProviderBase) || '');
  }, [aiProvider, currentProviderBase, onBaseUrlChange]);

  useEffect(() => {
    let cancelled = false;

    const loadModels = async () => {
      if ((aiProvider === 'openai-compatible' || aiProvider === 'ollama') && !aiKey.trim()) {
        setRemoteModels([]);
        setModelLoadStatus('idle');
        setModelLoadError(t('enterKeyToLoad'));
        return;
      }

      if ((aiProvider === 'openai-compatible' || aiProvider === 'ollama') && !isValidAbsoluteHttpUrl(currentProviderBase)) {
        setRemoteModels([]);
        setModelLoadStatus('idle');
        setModelLoadError(t('enterValidBaseUrl'));
        return;
      }

      setModelLoadStatus('loading');
      setModelLoadError('');

      try {
        const discovered = await discoverModels(aiProvider, {
          apiKey: aiKey.trim(),
          baseUrl: currentProviderBase,
        });
        if (cancelled) return;
        setRemoteModels(discovered);
        setModelLoadStatus('ok');
      } catch (error) {
        if (cancelled) return;
        setRemoteModels([]);
        setModelLoadStatus('error');
        setModelLoadError(error instanceof Error ? error.message : t('failedToLoadModels'));
      }
    };

    const timer = window.setTimeout(loadModels, 450);
    return () => {
      window.clearTimeout(timer);
      cancelled = true;
    };
  }, [aiProvider, aiKey, currentProviderBase]);

  const modelsForRender = useMemo(() => {
    const fallback = getModelsByProvider(aiProvider);
    const baseList = remoteModels.length > 0 ? remoteModels : fallback;
    const merged = dedupeById(
      aiModel && !baseList.some((model) => model.id === aiModel)
        ? [...baseList, { id: aiModel, name: `Custom: ${aiModel}`, provider: aiProvider, isFree: false }]
        : baseList
    );
    return sortModelsByPrice(merged);
  }, [aiProvider, aiModel, remoteModels]);

  const selectedModel = modelsForRender.find((model) => model.id === aiModel);

  const handleProviderChange = (provider: AIProvider) => {
    onAIProviderChange(provider);
    const nextModels = getModelsByProvider(provider);
    if (nextModels.length > 0) {
      onAIModelChange(nextModels[0].id);
    }
  };

  const handleSave = () => {
    const keys = loadAPIKeys();
    saveAPIKeys({
      ...keys,
      [aiProvider]: aiKey,
      openaiCompatibleBase,
      ollamaBase,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    clearAPIKeys();
    setAIKey('');
    setOpenaiCompatibleBase(DEFAULT_OPENAI_COMPATIBLE_BASE);
    setOllamaBase(DEFAULT_OLLAMA_CLOUD_BASE);
    setRemoteModels([]);
    setModelLoadStatus('idle');
    setModelLoadError('');
  };

  const showBaseUrlInput = aiProvider === 'openai-compatible' || aiProvider === 'ollama';
  const baseUrlLabel = aiProvider === 'ollama' ? 'Ollama Cloud Base URL' : 'OpenAI-Compatible Base URL';
  const baseUrlPlaceholder = aiProvider === 'ollama' ? 'https://ollama.com' : 'https://api.openai.com/v1';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-ctp-accent flex items-center gap-2">
          <Brain className="h-6 w-6" />
          {t('aiConfig')}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-ctp-green to-ctp-teal hover:opacity-90 rounded-md text-sm transition-colors text-ctp-base font-medium"
          >
            <Save className="h-4 w-4" />
            {saved ? t('saved') : t('save')}
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-3 py-1.5 bg-ctp-red hover:bg-ctp-red/80 rounded-md text-sm transition-colors text-ctp-base"
          >
            <Trash2 className="h-4 w-4" />
            {t('clear')}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-ctp-subtext1 mb-3">
          {t('aiProvider')}
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {AI_PROVIDERS.map((provider) => (
            <button
              key={provider.value}
              onClick={() => handleProviderChange(provider.value)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                aiProvider === provider.value
                  ? 'border-ctp-accent bg-ctp-accent/10'
                  : 'border-ctp-surface2 bg-ctp-surface1/30 hover:border-ctp-overlay0'
              }`}
            >
              <div className="font-semibold text-ctp-text">{provider.label}</div>
              {provider.description && (
                <div className="text-sm text-ctp-subtext0 mt-1">{provider.description}</div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="ai-model" className="block text-sm font-medium text-ctp-subtext1 mb-2">
          {t('aiModelLabel')}
        </label>
        <select
          id="ai-model"
          value={aiModel}
          onChange={(e) => onAIModelChange(e.target.value)}
          className="block w-full px-3 py-2 border border-ctp-surface2 rounded-lg bg-ctp-surface1/50 text-ctp-text hover:border-ctp-surface2 focus:outline-none focus:ring-2 focus:ring-ctp-accent focus:border-transparent"
        >
          {modelsForRender.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name} ({formatModelPrice(model)})
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-ctp-subtext0">
          {selectedModel ? formatModelPrice(selectedModel) : t('chooseModel')}
        </p>
        {modelLoadStatus === 'loading' && (
          <p className="mt-1 text-xs text-ctp-blue">{t('loadingModel')}</p>
        )}
        {modelLoadStatus === 'error' && (
          <p className="mt-1 text-xs text-ctp-red">{modelLoadError}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-ctp-subtext1 mb-2 flex items-center gap-2">
          <Key className="h-4 w-4" />
          {t('apiKeyLabel', { provider: providerLabel(aiProvider) })}
        </label>
        <div className="relative">
          <input
            type={showAIKey ? 'text' : 'password'}
            value={aiKey}
            onChange={(e) => setAIKey(e.target.value)}
            placeholder={t('enterApiKey', { provider: providerLabel(aiProvider) })}
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
          {aiProvider === 'openai-compatible' && 'Use the key for your OpenAI-compatible endpoint.'}
          {aiProvider === 'ollama' && (
            <>
              Get your API key at{' '}
              <a href="https://ollama.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-ctp-lavender hover:text-ctp-mauve underline">
                ollama.com/settings/keys
              </a>
            </>
          )}
        </p>
        <div className="mt-2 bg-ctp-yellow/20 border border-ctp-yellow/30 rounded-lg p-3 text-sm text-ctp-yellow">
          <strong>Security:</strong> {t('securityNote')}
        </div>
      </div>

      {showBaseUrlInput && (
        <div>
          <label className="block text-sm font-medium text-ctp-subtext1 mb-2">
            {baseUrlLabel}
          </label>
          <input
            type="text"
            value={aiProvider === 'ollama' ? ollamaBase : openaiCompatibleBase}
            onChange={(e) => {
              if (aiProvider === 'ollama') {
                setOllamaBase(e.target.value);
              } else {
                setOpenaiCompatibleBase(e.target.value);
              }
            }}
            placeholder={baseUrlPlaceholder}
            className="block w-full px-3 py-2 border border-ctp-surface2 rounded-lg bg-ctp-surface1/50 text-ctp-text placeholder-ctp-overlay0 focus:outline-none focus:ring-2 focus:ring-ctp-accent focus:border-transparent"
          />
          <p className="mt-1 text-xs text-ctp-subtext0">
            {aiProvider === 'ollama'
              ? t('ollamaWarning')
              : t('openaiWarning')}
          </p>
        </div>
      )}
    </div>
  );
}
