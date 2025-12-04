import { useState, useEffect } from 'react';
import { Globe, Key, Eye, EyeOff, Save, CheckCircle, ExternalLink, Zap } from 'lucide-react';
import { 
  getFetcherAPIKeys, 
  saveFetcherAPIKeys, 
  getPreferredFetcher, 
  setPreferredFetcher 
} from '../utils/storage';
import { getAvailableServices, type FetcherServiceType } from '../services/fetcher-api';
import type { FetcherAPIKeys } from '../types/theme';

interface FetcherConfigProps {
  onConfigChange?: (config: { service: FetcherServiceType; apiKeys: FetcherAPIKeys }) => void;
}

interface ServiceInfo {
  service: FetcherServiceType;
  name: string;
  description: string;
  freeInfo: string;
  url: string;
  requiresKey: boolean;
  keyPlaceholder: string;
  keyField: keyof FetcherAPIKeys | null;
}

const SERVICES: ServiceInfo[] = [
  {
    service: 'auto',
    name: 'Auto (Recommended)',
    description: 'Automatically selects best available service with fallback chain',
    freeInfo: 'Uses available services in priority order',
    url: '',
    requiresKey: false,
    keyPlaceholder: '',
    keyField: null,
  },
  {
    service: 'firecrawl',
    name: 'Firecrawl',
    description: 'Best HTML+CSS extraction with full JavaScript rendering',
    freeInfo: '500 free credits/month',
    url: 'https://firecrawl.dev/',
    requiresKey: true,
    keyPlaceholder: 'fc-xxxxxxxx',
    keyField: 'firecrawl',
  },
  {
    service: 'jina',
    name: 'Jina Reader',
    description: 'Free service, returns markdown content with JS rendering',
    freeInfo: 'FREE - No API key required!',
    url: 'https://jina.ai/reader/',
    requiresKey: false,
    keyPlaceholder: '',
    keyField: null,
  },
  {
    service: 'scrapingbee',
    name: 'ScrapingBee',
    description: 'Full JavaScript rendering with complete HTML output',
    freeInfo: '1000 free API calls',
    url: 'https://www.scrapingbee.com/',
    requiresKey: true,
    keyPlaceholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    keyField: 'scrapingbee',
  },
  {
    service: 'browserless',
    name: 'Browserless',
    description: 'Cloud browser automation service',
    freeInfo: '6 free hours/month',
    url: 'https://browserless.io/',
    requiresKey: true,
    keyPlaceholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    keyField: 'browserless',
  },
  {
    service: 'cors-proxy',
    name: 'CORS Proxy (Basic)',
    description: 'Basic HTML fetch without JavaScript rendering',
    freeInfo: 'FREE - No API key required',
    url: '',
    requiresKey: false,
    keyPlaceholder: '',
    keyField: null,
  },
];

export function FetcherConfig({ onConfigChange }: FetcherConfigProps) {
  const [apiKeys, setApiKeys] = useState<FetcherAPIKeys>({});
  const [preferredService, setPreferredServiceState] = useState<FetcherServiceType>('auto');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);

  // Load saved configuration
  useEffect(() => {
    const savedKeys = getFetcherAPIKeys();
    const savedService = getPreferredFetcher();
    setApiKeys(savedKeys);
    setPreferredServiceState(savedService);
  }, []);

  // Notify parent of config changes
  useEffect(() => {
    onConfigChange?.({ service: preferredService, apiKeys });
  }, [preferredService, apiKeys, onConfigChange]);

  const handleSave = () => {
    saveFetcherAPIKeys(apiKeys);
    setPreferredFetcher(preferredService);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleKeyChange = (field: keyof FetcherAPIKeys, value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [field]: value || undefined,
    }));
  };

  const toggleShowKey = (field: string) => {
    setShowKeys(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const availableServices = getAvailableServices(apiKeys);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-ctp-text flex items-center gap-2">
          <Globe className="h-5 w-5 text-ctp-blue" />
          Web Fetcher Configuration
        </h3>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-ctp-green to-ctp-teal hover:opacity-90 rounded-md text-sm transition-colors text-ctp-base font-medium"
        >
          {saved ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Saved!
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Config
            </>
          )}
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-ctp-blue/10 border border-ctp-blue/30 rounded-lg p-4 text-sm">
        <div className="flex items-start gap-3">
          <Zap className="h-5 w-5 text-ctp-blue flex-shrink-0 mt-0.5" />
          <div className="text-ctp-subtext1">
            <strong className="text-ctp-text">API-based fetchers</strong> extract website content including HTML, CSS, and colors.
            <br />
            <span className="text-ctp-subtext0">
              Jina Reader is free and always available. For best results with JavaScript-heavy sites, configure Firecrawl or ScrapingBee.
            </span>
          </div>
        </div>
      </div>

      {/* Service Selection */}
      <div>
        <label className="block text-sm font-medium text-ctp-subtext1 mb-3">
          Preferred Fetcher Service
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SERVICES.map(service => {
            const availability = availableServices.find(s => s.service === service.service);
            const isAvailable = service.service === 'auto' || availability?.available;
            const isSelected = preferredService === service.service;

            return (
              <button
                key={service.service}
                onClick={() => setPreferredServiceState(service.service)}
                disabled={!isAvailable && service.requiresKey}
                className={`
                  relative p-4 rounded-lg border-2 text-left transition-all
                  ${isSelected 
                    ? 'border-ctp-accent bg-ctp-accent/10' 
                    : 'border-ctp-surface2 hover:border-ctp-overlay0 bg-ctp-surface0/50'
                  }
                  ${!isAvailable && service.requiresKey ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-ctp-text flex items-center gap-2">
                      {service.name}
                      {isSelected && (
                        <CheckCircle className="h-4 w-4 text-ctp-green" />
                      )}
                    </div>
                    <p className="text-xs text-ctp-subtext0 mt-1">{service.description}</p>
                  </div>
                  {service.url && (
                    <a
                      href={service.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-ctp-lavender hover:text-ctp-mauve"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
                <div className={`
                  mt-2 text-xs px-2 py-1 rounded-full inline-block
                  ${service.freeInfo.includes('FREE') || service.freeInfo.includes('free') 
                    ? 'bg-ctp-green/20 text-ctp-green' 
                    : 'bg-ctp-surface1 text-ctp-subtext0'
                  }
                `}>
                  {service.freeInfo}
                </div>
                {service.requiresKey && !isAvailable && (
                  <div className="mt-2 text-xs text-ctp-peach">
                    API key required ↓
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* API Keys Section */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-ctp-subtext1 flex items-center gap-2">
          <Key className="h-4 w-4" />
          API Keys (Optional)
        </h4>
        
        <div className="bg-ctp-yellow/10 border border-ctp-yellow/30 rounded-lg p-3 text-xs text-ctp-yellow">
          <strong>Security Note:</strong> API keys are stored locally in your browser using base64 encoding. They are only sent to their respective services.
        </div>

        {SERVICES.filter(s => s.requiresKey && s.keyField).map(service => (
          <div key={service.service} className="space-y-2">
            <label className="block text-sm font-medium text-ctp-subtext1">
              {service.name} API Key
            </label>
            <div className="relative">
              <input
                type={showKeys[service.keyField!] ? 'text' : 'password'}
                value={apiKeys[service.keyField!] || ''}
                onChange={e => handleKeyChange(service.keyField!, e.target.value)}
                placeholder={service.keyPlaceholder}
                className="block w-full pr-10 px-3 py-2 border border-ctp-surface2 rounded-lg bg-ctp-surface1/50 text-ctp-text placeholder-ctp-overlay0 focus:outline-none focus:ring-2 focus:ring-ctp-accent focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => toggleShowKey(service.keyField!)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-ctp-overlay1 hover:text-ctp-text"
              >
                {showKeys[service.keyField!] ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-ctp-subtext0">
              Get your API key at{' '}
              <a 
                href={service.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-ctp-lavender hover:text-ctp-mauve underline"
              >
                {new URL(service.url).hostname}
              </a>
              {' '}• {service.freeInfo}
            </p>
          </div>
        ))}
      </div>

      {/* Current Status */}
      <div className="bg-ctp-surface0 rounded-lg p-4">
        <h4 className="text-sm font-medium text-ctp-subtext1 mb-3">Service Priority Chain</h4>
        <div className="flex flex-wrap gap-2">
          {availableServices
            .filter(s => s.available)
            .map((service, index) => (
              <div key={service.service} className="flex items-center gap-1">
                <span className={`
                  px-2 py-1 rounded text-xs
                  ${service.service === preferredService || (preferredService === 'auto' && index === 0)
                    ? 'bg-ctp-accent/20 text-ctp-accent font-medium'
                    : 'bg-ctp-surface1 text-ctp-subtext0'
                  }
                `}>
                  {service.service}
                </span>
                {index < availableServices.filter(s => s.available).length - 1 && (
                  <span className="text-ctp-overlay0">→</span>
                )}
              </div>
            ))}
        </div>
        <p className="text-xs text-ctp-subtext0 mt-2">
          If the preferred service fails, the next available service will be used automatically.
        </p>
      </div>
    </div>
  );
}
