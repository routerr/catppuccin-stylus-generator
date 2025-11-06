import { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Save, Trash2 } from 'lucide-react';
import { loadAPIKeys, saveAPIKeys, clearAPIKeys } from '../utils/storage';
import type { AIProvider } from '../types/theme';

interface APIKeyConfigProps {
  aiProvider: AIProvider;
  onKeyChange: (key: string) => void;
}

export function APIKeyConfig({ aiProvider, onKeyChange }: APIKeyConfigProps) {
  const [aiKey, setAIKey] = useState('');
  const [showAIKey, setShowAIKey] = useState(false);
  const [saved, setSaved] = useState(false);

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Key className="h-5 w-5" />
          API Key Configuration
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-3 py-1.5 grass-green-gradient hover:opacity-90 rounded-md text-sm transition-colors text-white font-medium"
          >
            <Save className="h-4 w-4" />
            {saved ? 'Saved!' : 'Save Key'}
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-md text-sm transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </button>
        </div>
      </div>

      <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3 text-sm text-yellow-200">
        <strong>Security Note:</strong> Your API key is stored locally in your browser and only sent to {aiProvider === 'openrouter' ? 'OpenRouter' : 'Chutes AI'}.
      </div>

      {/* AI Provider API Key */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {aiProvider === 'openrouter' ? 'OpenRouter' : 'Chutes AI'} API Key
        </label>
        <div className="relative">
          <input
            type={showAIKey ? 'text' : 'password'}
            value={aiKey}
            onChange={(e) => setAIKey(e.target.value)}
            placeholder={`Enter your ${aiProvider === 'openrouter' ? 'OpenRouter' : 'Chutes'} API key`}
            className="block w-full pr-10 px-3 py-2 border border-gray-600 rounded-lg bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={() => setShowAIKey(!showAIKey)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200"
          >
            {showAIKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          Get your free API key at{' '}
          <a
            href={aiProvider === 'openrouter' ? 'https://openrouter.ai/keys' : 'https://chutes.ai'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 underline"
          >
            {aiProvider === 'openrouter' ? 'openrouter.ai/keys' : 'chutes.ai'}
          </a>
        </p>
      </div>
    </div>
  );
}
