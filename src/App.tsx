import { useState } from 'react';
import { InputSelector } from './components/InputSelector';
import { APIKeyConfig } from './components/APIKeyConfig';
import { FetcherConfig } from './components/FetcherConfig';
import { ServiceSelector } from './components/ServiceSelector';
import { ThemePreview } from './components/ThemePreview';
import { ThinkingProcess, type ThinkingStep } from './components/ThinkingProcess';
import { FontSelector } from './components/FontSelector';
import type { AIProvider, ThemePackage, CrawlerResult, FetcherAPIKeys, FetcherAPIService, FetcherService } from './types/theme';
import type { PaletteDiagnostics } from './services/palette-profile';
import { loadSettings, saveSettings } from './utils/storage';
import { fetchWebsiteContent } from './services/fetcher';
import { fetchWithAPI } from './services/fetcher-api';
import { analyzeWebsiteColors } from './services/ai';
import { createUserStylePackage } from './services/generators';
import { useVersion } from './hooks/useVersion';
import catppuccinLogo from '/catppuccin.png';

function App() {
  const [aiProvider, setAIProvider] = useState<AIProvider>('openrouter');
  const [aiModel, setAIModel] = useState('tngtech/deepseek-r1t2-chimera:free');
  const [aiKey, setAIKey] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [themePackage, setThemePackage] = useState<ThemePackage | null>(null);
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const [discoveredOllamaModels, setDiscoveredOllamaModels] = useState<string[]>([]);
  const [crawlerWarnings, setCrawlerWarnings] = useState<string[]>([]);
  const version = useVersion();

  // Fetcher API state
  const [fetcherService, setFetcherService] = useState<FetcherAPIService>('auto');
  const [fetcherAPIKeys, setFetcherAPIKeys] = useState<FetcherAPIKeys>({});

  // Regeneration support state
  const [lastCrawlerResult, setLastCrawlerResult] = useState<CrawlerResult | null>(null);
  const [lastSource, setLastSource] = useState<FetcherService>('direct-fetch');
  const [lastAIConfig, setLastAIConfig] = useState<{ provider: AIProvider; model: string; apiKey: string } | null>(null);
  const [lastAiMappingChoice, setLastAiMappingChoice] = useState<boolean | null>(null);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [paletteDiagnostics, setPaletteDiagnostics] = useState<PaletteDiagnostics | null>(null);
  const [useAiMapping, setUseAiMapping] = useState<boolean>(() => {
    const settings = loadSettings();
    return settings.aiAssistedMapping ?? false;
  });
  const [accentBadgeCardTable, setAccentBadgeCardTable] = useState(true);
  const [accentAlerts, setAccentAlerts] = useState(true);
  const [lastPaletteProfile, setLastPaletteProfile] = useState<any | null>(null);
  const [lastCrawlAt, setLastCrawlAt] = useState<string | null>(null);
  const [parseErrorToast, setParseErrorToast] = useState<string | null>(null);

  // Font settings state
  const [normalFont, setNormalFont] = useState<string>(() => {
    const settings = loadSettings();
    return settings.normalFont ?? '';
  });
  const [monoFont, setMonoFont] = useState<string>(() => {
    const settings = loadSettings();
    return settings.monoFont ?? '';
  });
  

  const aiChangedSinceLast = !!(
    lastAIConfig && (
      lastAIConfig.provider !== aiProvider ||
      lastAIConfig.model !== aiModel ||
      lastAIConfig.apiKey !== aiKey
    )
  );
  const mappingChangedSinceLast = lastAiMappingChoice !== null && lastAiMappingChoice !== useAiMapping;
  const canRegenerate = hasCompleted && (aiChangedSinceLast || mappingChangedSinceLast);
  const canQuickRerun = !!lastCrawlerResult;

  const updateStep = (id: string, updates: Partial<ThinkingStep>) => {
    setThinkingSteps(prev => prev.map(step =>
      step.id === id ? { ...step, ...updates, timestamp: Date.now() } : step
    ));
  };

  const handleGenerate = async (url: string) => {
    if (aiProvider !== 'ollama' && !aiKey) {
      setError('Please provide your AI API key');
      return;
    }

    setIsProcessing(true);
    setError('');
    setProgress('Starting...');
    setThemePackage(null);
    setHasCompleted(false);
    setPaletteDiagnostics(null);
    setCrawlerWarnings([]);
    saveSettings({ aiAssistedMapping: useAiMapping });
    setLastPaletteProfile(null);
    setLastCrawlAt(null);

    try {
      // Fast regenerate: use cached content if available
      if (canRegenerate && lastCrawlerResult) {
        // Skip fetching, use cached content
        setThinkingSteps([
          { id: 'analyze', title: 'AI Color Analysis', description: 'Re-analyzing color scheme with new AI config', status: 'in_progress' },
          { id: 'map', title: 'Mapping to Catppuccin', description: 'Mapping colors to Catppuccin palette', status: 'pending' },
          { id: 'generate', title: 'Generating Themes', description: 'Creating Stylus, LESS, and CSS themes', status: 'pending' },
        ]);
        setProgress('Using cached content for fast regeneration...');
        setPaletteDiagnostics(lastCrawlerResult.cssAnalysis?.paletteProfile?.diagnostics || null);
        setLastPaletteProfile(lastCrawlerResult.cssAnalysis?.paletteProfile || null);
        await processContent(lastCrawlerResult, lastSource);
        return;
      }

      // Normal generation: fetch from URL
      setThinkingSteps([
        { id: 'fetch', title: 'Fetching Website', description: `Using ${fetcherService === 'auto' ? 'best available' : fetcherService} fetcher`, status: 'in_progress' },
        { id: 'analyze', title: 'AI Color Analysis', description: 'Analyzing color scheme with AI', status: 'pending' },
        { id: 'map', title: 'Mapping to Catppuccin', description: 'Mapping colors to Catppuccin palette', status: 'pending' },
        { id: 'generate', title: 'Generating Themes', description: 'Creating Stylus, LESS, and CSS themes', status: 'pending' },
      ]);

      // Step 1: Fetch website content using API-based fetcher
      setProgress('Fetching website content...');
      const fetchResult = await fetchWithAPI(url, {
        service: fetcherService,
        apiKeys: fetcherAPIKeys,
        enableFallback: true,
      });

      if (fetchResult.error) {
        updateStep('fetch', { status: 'error', details: fetchResult.error });
        throw new Error(`Failed to fetch website: ${fetchResult.error}`);
      }

      updateStep('fetch', {
        status: 'completed',
        details: `Found ${fetchResult.colors.length} colors from ${fetchResult.title} (via ${fetchResult.serviceUsed})`
      });

      // Convert to crawler-compatible format
      const crawlerResult: CrawlerResult = {
        url: fetchResult.url,
        title: fetchResult.title,
        content: fetchResult.html,
        html: fetchResult.html,
        colors: fetchResult.colors,
        cssAnalysis: fetchResult.cssAnalysis,
      };

      if (fetchResult.warnings?.length) {
        setCrawlerWarnings(fetchResult.warnings);
      }

      setLastCrawlerResult(crawlerResult);
      setLastSource(fetchResult.fetcher);
      setPaletteDiagnostics(crawlerResult.cssAnalysis?.paletteProfile?.diagnostics || null);
       setLastPaletteProfile(crawlerResult.cssAnalysis?.paletteProfile || null);
      setLastCrawlAt(new Date().toLocaleString());
      await processContent(crawlerResult, fetchResult.fetcher);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setProgress('');
      setIsProcessing(false);
    }
  };

  const processContent = async (crawlerResult: CrawlerResult, source: FetcherService) => {
    try {
      // Step 2: Analyze colors with AI
      updateStep('analyze', { status: 'in_progress' });
      setProgress('Analyzing colors with AI...');

      const { analysis, mappings, classRoles } = await analyzeWebsiteColors(crawlerResult, {
        provider: aiProvider,
        apiKey: aiKey,
        model: aiModel,
      }, { aiClassMapping: useAiMapping });

      updateStep('analyze', {
        status: 'completed',
        details: `Identified ${mappings.length} color mappings using ${aiProvider}/${aiModel}`
      });

      // Step 3: Map colors
      updateStep('map', {
        status: 'in_progress',
        description: 'Creating semantic color mappings for UI elements'
      });

      // Small delay to show the step
      await new Promise(resolve => setTimeout(resolve, 300));

      updateStep('map', {
        status: 'completed',
        details: `Mapped colors for buttons, text, backgrounds, and more`
      });

      // Step 4: Generate UserStyle theme
      updateStep('generate', { status: 'in_progress' });
      setProgress('Generating UserStyle theme...');

      // Attach AI role guesses to cssAnalysis for regeneration
      const cachedGuesses = (crawlerResult as any).cssAnalysis?.aiRoleGuesses;
      const combinedRoleGuesses = classRoles ?? analysis.classRoles ?? cachedGuesses;
      const updatedCssAnalysis = {
        ...((crawlerResult as any).cssAnalysis || {}),
        aiRoleGuesses: combinedRoleGuesses,
        accentToggles: {
          badgeCardTable: accentBadgeCardTable,
          alerts: accentAlerts,
        },
        fontSettings: {
          normalFont,
          monoFont,
        },
      };

      const pkg = createUserStylePackage(
        crawlerResult.url,
        mappings,
        analysis.accentColors,
        source as any,
        aiModel,
        updatedCssAnalysis
      );

      updateStep('generate', {
        status: 'completed',
        details: 'Generated themes for Latte, Frappé, Macchiato, and Mocha'
      });

      setThemePackage(pkg);
      // Persist last crawler + cssAnalysis (including AI role guesses) for fast regenerate
      setLastCrawlerResult({ ...crawlerResult, cssAnalysis: updatedCssAnalysis });
      setLastAIConfig({ provider: aiProvider, model: aiModel, apiKey: aiKey });
      setLastAiMappingChoice(useAiMapping);
      setHasCompleted(true);
      setProgress('');
      } catch (err) {
        // Mark current step as error
        const currentStep = thinkingSteps.find(s => s.status === 'in_progress');
        if (currentStep) {
          updateStep(currentStep.id, {
            status: 'error',
            details: err instanceof Error ? err.message : 'Processing failed'
          });
        }
        const message = err instanceof Error ? err.message : String(err);
        // Detect parse/JSON errors and surface a toast
        if (/json|parse/i.test(message)) {
          setParseErrorToast('AI response could not be parsed. Try again or switch models.');
          setTimeout(() => setParseErrorToast(null), 6000);
        }
        throw err;
      } finally {
      setIsProcessing(false);
    }
  };

  const handleRegenerateFromCache = async () => {
    if (!lastCrawlerResult) return;
    setIsProcessing(true);
    setError('');
    setProgress('Re-running with cached crawl...');
    setPaletteDiagnostics(lastCrawlerResult.cssAnalysis?.paletteProfile?.diagnostics || null);
    setLastPaletteProfile(lastCrawlerResult.cssAnalysis?.paletteProfile || null);
    setThinkingSteps([
      { id: 'analyze', title: 'AI Color Analysis', description: 'Re-analyzing color scheme with current AI settings', status: 'in_progress' },
      { id: 'map', title: 'Mapping to Catppuccin', description: 'Mapping colors to Catppuccin palette', status: 'pending' },
      { id: 'generate', title: 'Generating Themes', description: 'Creating Stylus, LESS, and CSS themes', status: 'pending' },
    ]);
    try {
      await processContent(lastCrawlerResult, lastSource);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadPaletteProfile = () => {
    const profile = lastPaletteProfile;
    if (!profile) return;
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${new URL(profile.url || lastCrawlerResult?.url || 'profile://').hostname || 'palette'}.palette-profile.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ctp-base via-ctp-mantle to-ctp-crust text-ctp-text">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="text-center mb-12">
          {/* Catppuccin Icon */}
          <div className="flex justify-center mb-6">
            <img
              src={catppuccinLogo}
              alt="Catppuccin"
              onError={(e) => {
                console.error('Image failed to load:', e);
                // Cast to HTMLImageElement and set fallback
                if (e.currentTarget instanceof HTMLImageElement) {
                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'%3E%3Crect width='100' height='100' fill='%2345475a'/%3E%3Ccircle cx='50' cy='50' r='40' fill='%23cba6f7'/%3E%3Cpath d='M30,30 L70,30 L70,70 L30,70 Z' fill='%23cba6f7'/%3E%3Cpath d='M40,40 L60,40 L60,60 L40,60 Z' fill='%23f5e0dc'/%3E%3C/svg%3E";
                }
              }}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full shadow-lg shadow-ctp-accent/50 hover:shadow-ctp-accent/70 transition-all duration-300 hover:scale-110"
            />
          </div>

          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-ctp-accent to-ctp-bi-accent bg-clip-text text-transparent">
            Catppuccin Theme Generator
          </h1>
          <p className="text-ctp-subtext0 text-lg">
            Analyze any website and generate beautiful Catppuccin themes in Stylus, LESS, and CSS
          </p>
          <p className="text-ctp-green text-sm mt-2">
            ✨ Generated and powered by advanced AI models for accurate color analysis! ✨
          </p>
          <a
            href="https://github.com/catppuccin/catppuccin"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-sm text-ctp-lavender hover:text-ctp-mauve underline transition-colors"
          >
            Learn more about Catppuccin
          </a>
          <a
            href="https://github.com/openstyles/stylus"
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-1 text-sm text-ctp-lavender hover:text-ctp-mauve underline transition-colors"
          >
            Learn more about Stylus
          </a>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left Column - Configuration */}
          <div className="space-y-6">
            <div className="bg-ctp-surface0/80 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-ctp-surface2">
              <h2 className="text-2xl font-bold mb-6 text-ctp-accent">AI Configuration</h2>

              <ServiceSelector
                aiProvider={aiProvider}
                onAIProviderChange={setAIProvider}
                aiModel={aiModel}
                onAIModelChange={setAIModel}
                ollamaModels={discoveredOllamaModels}
              />
            </div>

            <div className="bg-ctp-surface0/80 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-ctp-surface2">
              <APIKeyConfig
                aiProvider={aiProvider}
                onKeyChange={(key) => setAIKey(key)}
                onPickModel={(m) => setAIModel(m)}
                onModelsDiscovered={(models) => setDiscoveredOllamaModels(models)}
              />
            </div>

            <div className="bg-ctp-surface0/80 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-ctp-surface2">
              <FetcherConfig
                onConfigChange={(config) => {
                  setFetcherService(config.service);
                  setFetcherAPIKeys(config.apiKeys);
                }}
              />
            </div>

            <div className="bg-ctp-surface0/80 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-ctp-surface2 relative z-20">
              <FontSelector
                normalFont={normalFont}
                monoFont={monoFont}
                onNormalFontChange={(font) => {
                  setNormalFont(font);
                  saveSettings({ normalFont: font, monoFont });
                }}
                onMonoFontChange={(font) => {
                  setMonoFont(font);
                  saveSettings({ normalFont, monoFont: font });
                }}
              />
            </div>

            <div className="bg-ctp-surface0/80 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-ctp-surface2 relative z-10">
              <h2 className="text-2xl font-bold mb-6 text-ctp-accent">Generate Theme</h2>

              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-ctp-text font-semibold">AI-assisted selector mapping</p>
                  <p className="text-xs text-ctp-subtext0">
                    Classifies selectors (buttons, alerts, badges, etc.) to guide accent rotation. Stored locally.
                    {useAiMapping && aiProvider === 'ollama' && (
                      <span className="ml-1 text-ctp-green font-semibold">Ollama mapping active (local, no API key needed).</span>
                    )}
                  </p>
                </div>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={useAiMapping}
                    onChange={(e) => {
                      setUseAiMapping(e.target.checked);
                      saveSettings({ aiAssistedMapping: e.target.checked });
                    }}
                  />
                  <div className="w-11 h-6 bg-ctp-surface2 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ctp-accent rounded-full peer peer-checked:bg-ctp-accent flex items-center px-1 transition">
                    <div className="w-4 h-4 bg-ctp-base rounded-full transition-transform peer-checked:translate-x-5" />
                  </div>
                </label>
              </div>

              <InputSelector
                onURLSubmit={handleGenerate}
                disabled={isProcessing}
                canRegenerate={canRegenerate}
              />
              <div className="mt-3 flex flex-wrap gap-3 items-center">
                <button
                  type="button"
                  onClick={handleRegenerateFromCache}
                  disabled={!canQuickRerun || isProcessing}
                  className={`px-3 py-2 rounded-md text-sm font-medium border ${
                    canQuickRerun && !isProcessing
                      ? 'bg-ctp-surface1 hover:bg-ctp-surface2 text-ctp-text border-ctp-surface2'
                      : 'bg-ctp-surface1/50 text-ctp-overlay1 border-ctp-surface2 cursor-not-allowed'
                  }`}
                  title={canQuickRerun ? 'Reuse the last crawl without refetching' : 'Run a crawl first to enable quick re-run'}
                >
                  Re-run with same crawl{lastCrawlerResult?.url ? ` (${new URL(lastCrawlerResult.url).hostname})` : ''}
                </button>
                {lastCrawlAt && (
                  <span className="text-xs text-ctp-subtext0">Last crawl: {lastCrawlAt}</span>
                )}
                <div className="flex items-center gap-2 text-xs text-ctp-subtext0">
                  <span className="font-semibold text-ctp-subtext1">Accent coverage</span>
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={accentBadgeCardTable}
                      onChange={(e) => setAccentBadgeCardTable(e.target.checked)}
                      className="h-4 w-4 rounded border-ctp-surface2 text-ctp-accent focus:ring-ctp-accent"
                    />
                    <span>Badges/Cards/Tables</span>
                  </label>
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={accentAlerts}
                      onChange={(e) => setAccentAlerts(e.target.checked)}
                      className="h-4 w-4 rounded border-ctp-surface2 text-ctp-accent focus:ring-ctp-accent"
                    />
                    <span>Alerts/Notifications</span>
                  </label>
                </div>
              </div>

              {crawlerWarnings.length > 0 && (
                <div className="mt-3 text-xs text-ctp-yellow bg-ctp-surface1/70 border border-ctp-surface2 rounded-lg p-3">
                  {crawlerWarnings.map((w, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-ctp-yellow">•</span>
                      <span>{w}</span>
                    </div>
                  ))}
                  <div className="mt-1 text-ctp-subtext1">The app will continue with direct HTTP fetch as a fallback.</div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Diagnostics & Preview */}
          <div className="space-y-6">
            {paletteDiagnostics && (
              <div className="bg-ctp-surface0/80 backdrop-blur-sm rounded-2xl p-6 border border-ctp-surface2">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <h3 className="text-xl font-semibold text-ctp-accent">Palette Diagnostics</h3>
                  <button
                    type="button"
                    onClick={handleDownloadPaletteProfile}
                    disabled={!lastPaletteProfile}
                    className={`text-xs px-3 py-1.5 rounded-md border ${
                      lastPaletteProfile
                        ? 'border-ctp-accent text-ctp-accent hover:bg-ctp-accent/10'
                        : 'border-ctp-surface2 text-ctp-overlay1 cursor-not-allowed'
                    }`}
                    title={lastPaletteProfile ? 'Download palette profile JSON' : 'Run a crawl to enable download'}
                  >
                    Download profile JSON
                  </button>
                </div>
                <div className="text-sm space-y-2 text-ctp-subtext0">
                  <p>
                    <span className="text-ctp-subtext1">CSS Variables:</span>{' '}
                    <span className="text-ctp-text">{paletteDiagnostics.cssVariableCount}</span>
                  </p>
                  <p>
                    <span className="text-ctp-subtext1">Inferred Roles:</span>{' '}
                    <span className="text-ctp-text">{paletteDiagnostics.inferredRoles.length}</span>
                  </p>
                  {paletteDiagnostics.warnings.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-ctp-yellow font-medium">Warnings</p>
                      <ul className="list-disc list-inside space-y-1">
                        {paletteDiagnostics.warnings.map((warning, idx) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                      <div className="text-xs text-ctp-subtext1 space-y-1">
                        <div className="font-semibold text-ctp-subtext0">改善建議：</div>
                        <ul className="list-disc list-inside space-y-1">
                          <li>若是 JS 重站，開啟並測試 Playwright 爬蟲（API Key → Playwright Crawler）；抓不到 CSS 規則會讓角色推斷不足。</li>
                          <li>提供更多 CSS 變數/內嵌 style：有自訂樣式時，優先在頁面/快照中保留 <code className="px-1 py-0.5 bg-ctp-surface1 rounded text-ctp-text">--color-*</code>、<code className="px-1 py-0.5 bg-ctp-surface1 rounded text-ctp-text">--theme-*</code> 等 token。</li>
                          <li>避免過度簡化的 HTML：若使用靜態快照/上傳資料夾，請包含主要 CSS 檔，讓 class/變數分析更完整。</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  {paletteDiagnostics.inferredRoles.slice(0, 10).length > 0 && (
                    <div>
                      <p className="text-ctp-subtext1 font-medium">Sample Roles</p>
                      <ul className="list-disc list-inside space-y-1">
                        {paletteDiagnostics.inferredRoles.slice(0, 10).map((role) => (
                          <li key={role}>{role}</li>
                        ))}
                      </ul>
                      {paletteDiagnostics.inferredRoles.length > 10 && (
                        <p className="text-xs text-ctp-overlay1">
                          +{paletteDiagnostics.inferredRoles.length - 10} more
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Thinking Process Display */}
            {(isProcessing || thinkingSteps.length > 0) && (
              <ThinkingProcess steps={thinkingSteps} />
            )}

            {!isProcessing && <ThemePreview themePackage={themePackage} />}
          </div>
        </div>

        {parseErrorToast && <ParseErrorToast message={parseErrorToast} />}

        <footer className="text-center text-ctp-overlay0 text-sm mt-12 pb-8">
          <p className="mb-2">
            Made with Catppuccin |
            <a
              href="https://github.com/catppuccin/catppuccin"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 hover:text-ctp-lavender transition-colors"
            >
              GitHub
            </a>
          </p>
          <p className="text-ctp-overlay1 text-xs mb-3">
            Generated by Github Copilot, Claude Code, Roo Code, OpenAI Codex, Gemini Code assistant<br />
            Models: 
            Claude Opus 4.5, Claude Opus 4.1, Claude Sonnet 4.5, MiniMax M2, GPT 4.1, GPT 5, 
            GPT 5 Codex, DeepSeek R1 0528 Qwen 3, Gemini 2.5 Pro
          </p>

          {/* Version Banner */}
          {version && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-ctp-accent/10 to-ctp-bi-accent/10 rounded-lg border border-ctp-accent/20">
              <div className="flex items-center gap-2">
                <span className="text-ctp-accent font-mono font-semibold">
                  v{version.version}
                </span>
                <span className="text-ctp-overlay1">•</span>
                <span className="text-ctp-overlay0 text-xs">
                  {version.commitHash}
                </span>
                {version.branchName !== 'main' && (
                  <>
                    <span className="text-ctp-overlay1">•</span>
                    <span className="text-ctp-yellow text-xs">
                      {version.branchName}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}

export default App;

// Simple toast for parse errors
/* eslint-disable jsx-a11y/no-redundant-roles */
function ParseErrorToast({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="fixed bottom-6 right-6 z-50 max-w-sm bg-ctp-surface0 border border-ctp-red text-ctp-red px-4 py-3 rounded-lg shadow-lg"
    >
      <div className="font-semibold text-sm">Parse Error</div>
      <div className="text-xs text-ctp-text">{message}</div>
    </div>
  );
}
