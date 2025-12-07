import { useState, useEffect } from "react";
import { Globe, Key, Eye, EyeOff, CheckCircle } from "lucide-react";
import { loadAPIKeys, saveAPIKeys } from "../utils/storage";

/**
 * Crawler service keys configuration
 */
export interface CrawlerKeys {
  firecrawl?: string;
  scrapingbee?: string;
  browserless?: string;
}

interface CrawlerConfigProps {
  onKeyChange: (keys: CrawlerKeys) => void;
  disabled?: boolean;
}

/**
 * Service configuration with name, storage key, URL, and description
 */
const CRAWLER_SERVICES = [
  {
    id: "firecrawl" as const,
    name: "Firecrawl",
    url: "https://firecrawl.dev",
    description: "500 free credits, includes branding color extraction",
    color: "ctp-peach",
  },
  {
    id: "scrapingbee" as const,
    name: "ScrapingBee",
    url: "https://scrapingbee.com",
    description: "1000 free credits, stable premium proxies",
    color: "ctp-yellow",
  },
  {
    id: "browserless" as const,
    name: "Browserless",
    url: "https://browserless.io",
    description: "Full Puppeteer environment, 6 hours free",
    color: "ctp-blue",
  },
] as const;

/**
 * Crawler Service Configuration Component
 *
 * Allows users to configure multiple crawler API keys for JS-rendered sites.
 * Supports Firecrawl, ScrapingBee, and Browserless as backup options.
 */
export function CrawlerConfig({ onKeyChange, disabled }: CrawlerConfigProps) {
  const [keys, setKeys] = useState<CrawlerKeys>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [isExpanded, setIsExpanded] = useState(false);
  const [saved, setSaved] = useState(false);

  // Count configured services
  const configuredCount = Object.values(keys).filter(Boolean).length;

  useEffect(() => {
    // Load saved keys
    const storedKeys = loadAPIKeys();
    const crawlerKeys: CrawlerKeys = {
      firecrawl: storedKeys.firecrawl,
      scrapingbee: storedKeys.scrapingbee,
      browserless: storedKeys.browserless,
    };
    setKeys(crawlerKeys);
    // Auto-expand if any key exists
    if (Object.values(crawlerKeys).some(Boolean)) {
      setIsExpanded(true);
    }
  }, []);

  useEffect(() => {
    // Notify parent of key changes
    onKeyChange(keys);
  }, [keys, onKeyChange]);

  const handleKeyChange = (serviceId: keyof CrawlerKeys, value: string) => {
    setKeys((prev) => ({ ...prev, [serviceId]: value }));
  };

  const toggleShowKey = (serviceId: string) => {
    setShowKeys((prev) => ({ ...prev, [serviceId]: !prev[serviceId] }));
  };

  const handleSave = () => {
    const storedKeys = loadAPIKeys();
    saveAPIKeys({
      ...storedKeys,
      firecrawl: keys.firecrawl,
      scrapingbee: keys.scrapingbee,
      browserless: keys.browserless,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-ctp-surface0/80 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-ctp-surface2">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <h3 className="text-lg font-semibold text-ctp-text flex items-center gap-2">
          <Globe className="h-5 w-5 text-ctp-peach" />
          Crawler Services (Optional)
          {configuredCount > 0 && (
            <span className="text-xs bg-ctp-green/20 text-ctp-green px-2 py-0.5 rounded-full">
              {configuredCount} configured
            </span>
          )}
        </h3>
        <span className="text-ctp-overlay0 text-sm">
          {isExpanded ? "▼" : "▶"}
        </span>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          <div className="bg-ctp-yellow/10 border border-ctp-yellow/20 rounded-lg p-3 text-sm text-ctp-yellow">
            <strong>For JavaScript-heavy sites:</strong> Some websites (like
            Gemini, ChatGPT, Stripe) require JavaScript rendering. Configure one
            or more crawler services below. They will be tried in order as
            fallbacks.
          </div>

          {CRAWLER_SERVICES.map((service) => (
            <div key={service.id} className="space-y-2">
              <label className="block text-sm font-medium text-ctp-subtext1">
                <Key className={`inline h-4 w-4 mr-1 text-${service.color}`} />
                {service.name} API Key
              </label>
              <div className="relative">
                <input
                  type={showKeys[service.id] ? "text" : "password"}
                  value={keys[service.id] || ""}
                  onChange={(e) => handleKeyChange(service.id, e.target.value)}
                  placeholder={`Enter your ${service.name} API key`}
                  disabled={disabled}
                  className={`block w-full pr-10 px-3 py-2 border border-ctp-surface2 rounded-lg bg-ctp-surface1/50 text-ctp-text placeholder-ctp-overlay0 hover:border-ctp-surface2 focus:outline-none focus:ring-2 focus:ring-${service.color} focus:border-transparent disabled:opacity-50`}
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey(service.id)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-ctp-overlay1 hover:text-ctp-text"
                >
                  {showKeys[service.id] ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-ctp-subtext0">
                {service.description} —{" "}
                <a
                  href={service.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-${service.color} hover:opacity-80 underline transition-colors`}
                >
                  {service.url.replace("https://", "")}
                </a>
              </p>
            </div>
          ))}

          <div className="pt-2 border-t border-ctp-surface2">
            <p className="text-xs text-ctp-overlay0 mb-3">
              <strong>Fallback order:</strong> When crawling fails, services are
              tried in this order: Firecrawl → ScrapingBee → Browserless
            </p>
            <button
              onClick={handleSave}
              disabled={disabled}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-ctp-peach to-ctp-yellow hover:opacity-90 rounded-lg text-sm transition-colors text-ctp-base font-medium disabled:opacity-50"
            >
              {saved ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Saved!
                </>
              ) : (
                "Save All Keys"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
