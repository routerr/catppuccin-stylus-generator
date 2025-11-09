import { useState } from 'react';
import { Globe } from 'lucide-react';

interface URLInputProps {
  onSubmit: (url: string) => void;
  disabled?: boolean;
}

export function URLInput({ onSubmit, disabled }: URLInputProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const validateURL = (input: string): boolean => {
    try {
      new URL(input);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!validateURL(url)) {
      setError('Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    onSubmit(url);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="url" className="block text-sm font-medium text-ctp-subtext1 mb-2">
          Website URL
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Globe className="h-5 w-5 text-ctp-overlay1" />
          </div>
          <input
            type="text"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={disabled}
            placeholder="https://example.com"
            className="block w-full pl-10 pr-3 py-3 border border-ctp-surface2 rounded-lg bg-ctp-surface1/50 text-ctp-text placeholder-ctp-overlay0 hover:border-ctp-surface2 hover:shadow-none focus:outline-none focus:ring-2 focus:ring-ctp-accent focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        {error && (
          <p className="mt-2 text-sm text-ctp-red">{error}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={disabled}
        className="w-full bg-gradient-to-r from-ctp-accent to-ctp-bi-accent hover:opacity-90 text-ctp-base font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
      >
        {disabled ? 'Processing...' : 'Generate Theme'}
      </button>
    </form>
  );
}
