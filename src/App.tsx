import { useEffect, useState } from 'react';
import { KeyRound, Settings2, X } from 'lucide-react';
import { InputSelector } from './components/InputSelector';
import { AIConfig } from './components/AIConfig';
import { FetcherConfig } from './components/FetcherConfig';
import { ThemePreview } from './components/ThemePreview';
import { ThinkingProcess, type ThinkingStep } from './components/ThinkingProcess';
import { FontSelector } from './components/FontSelector';
import { ThemeSelector } from './components/ThemeSelector';
import { LanguageSelector } from './components/LanguageSelector';
import { useLanguage } from './hooks/useLanguage';
import type { AIProvider, ThemePackage, CrawlerResult, FetcherAPIKeys, FetcherAPIService, FetcherService } from './types/theme';
import type { PaletteDiagnostics } from './services/palette-profile';
import { loadSettings, saveSettings } from './utils/storage';
import { fetchWithAPI } from './services/fetcher-api';
import { analyzeWebsiteColors } from './services/ai';
import { createUserStylePackage } from './services/generators';
import { useVersion } from './hooks/useVersion';
import catppuccinLogo from '/catppuccin.png';

function App() {
  const { language, t } = useLanguage();
  const [aiProvider, setAIProvider] = useState<AIProvider>('openrouter');
  const [aiModel, setAIModel] = useState('tngtech/deepseek-r1t2-chimera:free');
  const [aiKey, setAIKey] = useState('');
  const [aiBaseUrl, setAIBaseUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [themePackage, setThemePackage] = useState<ThemePackage | null>(null);
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const [crawlerWarnings, setCrawlerWarnings] = useState<string[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);
  const version = useVersion();

  // Fetcher API state
  const [fetcherService, setFetcherService] = useState<FetcherAPIService>('auto');
  const [fetcherAPIKeys, setFetcherAPIKeys] = useState<FetcherAPIKeys>({});

  // Regeneration support state
  const [lastCrawlerResult, setLastCrawlerResult] = useState<CrawlerResult | null>(null);
  const [lastSource, setLastSource] = useState<FetcherService | string>('direct-fetch');
  const [lastAIConfig, setLastAIConfig] = useState<{ provider: AIProvider; model: string; apiKey: string; baseUrl: string } | null>(null);
  const [lastAiMappingChoice, setLastAiMappingChoice] = useState<boolean | null>(null);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [paletteDiagnostics, setPaletteDiagnostics] = useState<PaletteDiagnostics | null>(null);
  const [useAiMapping, setUseAiMapping] = useState<boolean>(() => {
    const settings = loadSettings();
    return settings.aiAssistedMapping ?? true;
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
      lastAIConfig.apiKey !== aiKey ||
      lastAIConfig.baseUrl !== aiBaseUrl
    )
  );
  const mappingChangedSinceLast = lastAiMappingChoice !== null && lastAiMappingChoice !== useAiMapping;
  const canRegenerate = hasCompleted && (aiChangedSinceLast || mappingChangedSinceLast);
  const canQuickRerun = !!lastCrawlerResult;
  const configuredFetcherKeyCount = Object.values(fetcherAPIKeys).filter((value) => Boolean(value?.trim())).length;
  const hasAiCredential = Boolean(aiKey.trim());

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSettingsOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isSettingsOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSettingsOpen]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const updateStep = (id: string, updates: Partial<ThinkingStep>) => {
    setThinkingSteps(prev => prev.map(step =>
      step.id === id ? { ...step, ...updates, timestamp: Date.now() } : step
    ));
  };

  const handleGenerate = async (url: string) => {
    if (!aiKey) {
      setError('Please provide your AI API key');
      return;
    }

    setIsProcessing(true);
    setError('');
    setProgress(t('msgStarting'));
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
          { id: 'analyze', title: t('stepAnalyzeTitle'), description: t('stepAnalyzeDescRe'), status: 'in_progress' },
          { id: 'map', title: t('stepMapTitle'), description: t('stepMapDesc'), status: 'pending' },
          { id: 'generate', title: t('stepGenerateTitle'), description: t('stepGenerateDesc'), status: 'pending' },
        ]);
        setProgress(t('msgCached'));
        setPaletteDiagnostics(lastCrawlerResult.cssAnalysis?.paletteProfile?.diagnostics || null);
        setLastPaletteProfile(lastCrawlerResult.cssAnalysis?.paletteProfile || null);
        await processContent(lastCrawlerResult, lastSource as FetcherService);
        return;
      }

      // Normal generation: fetch from URL
      setThinkingSteps([
        { id: 'fetch', title: t('stepFetchTitle'), description: fetcherService === 'auto' ? t('stepFetchDescBest') : t('stepFetchDesc', { service: fetcherService }), status: 'in_progress' },
        { id: 'analyze', title: t('stepAnalyzeTitle'), description: t('stepAnalyzeDesc'), status: 'pending' },
        { id: 'map', title: t('stepMapTitle'), description: t('stepMapDesc'), status: 'pending' },
        { id: 'generate', title: t('stepGenerateTitle'), description: t('stepGenerateDesc'), status: 'pending' },
      ]);

      // Step 1: Fetch website content using API-based fetcher
      setProgress(t('msgFetching'));
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
        details: t('msgFetchFound', { count: fetchResult.colors.length, title: fetchResult.title, service: fetchResult.serviceUsed })
      });

      // Convert to crawler-compatible format
      const crawlerResult: CrawlerResult = {
        url: fetchResult.url,
        title: fetchResult.title,
        content: fetchResult.html,
        html: fetchResult.html,
        colors: fetchResult.colors,
        cssAnalysis: undefined,
      };

      if ((fetchResult as any).warnings?.length) {
        setCrawlerWarnings((fetchResult as any).warnings);
      }

      setLastCrawlerResult(crawlerResult);
      setLastSource(fetchResult.serviceUsed as string);
      setPaletteDiagnostics(crawlerResult.cssAnalysis?.paletteProfile?.diagnostics || null);
      setLastPaletteProfile(crawlerResult.cssAnalysis?.paletteProfile || null);
      setLastCrawlAt(new Date().toLocaleString());
      await processContent(crawlerResult, fetchResult.serviceUsed as unknown as FetcherService);
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
      setProgress(t('msgAnalyzing'));

      const { analysis, mappings, mode, classRoles } = await analyzeWebsiteColors(crawlerResult, {
        provider: aiProvider,
        apiKey: aiKey,
        model: aiModel,
        baseUrl: aiBaseUrl,
      }, { aiClassMapping: useAiMapping });

      updateStep('analyze', {
        status: 'completed',
        details: t('msgAnalyzeIdentified', { count: mappings.length, provider: aiProvider, model: aiModel })
      });

      // Step 3: Map colors
      updateStep('map', {
        status: 'in_progress',
        description: t('stepMapDescInProg')
      });

      // Small delay to show the step
      await new Promise(resolve => setTimeout(resolve, 300));

      updateStep('map', {
        status: 'completed',
        details: t('msgMapMapped')
      });

      // Step 4: Generate UserStyle theme
      updateStep('generate', { status: 'in_progress' });
      setProgress(t('msgGenerating'));

      // Attach AI role guesses to cssAnalysis for regeneration
      const cachedGuesses = (crawlerResult as any).cssAnalysis?.aiRoleGuesses;
      const combinedRoleGuesses = classRoles ?? (analysis as any).classRoles ?? cachedGuesses;
      const updatedCssAnalysis = {
        ...((crawlerResult as any).cssAnalysis || {}),
        aiRoleGuesses: combinedRoleGuesses,
        detectedMode: mode || (analysis as any)?.mode,
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
        details: t('msgGenerateGenerated')
      });

      setThemePackage(pkg);
      // Persist last crawler + cssAnalysis (including AI role guesses) for fast regenerate
      setLastCrawlerResult({ ...crawlerResult, cssAnalysis: updatedCssAnalysis });
      setLastAIConfig({ provider: aiProvider, model: aiModel, apiKey: aiKey, baseUrl: aiBaseUrl });
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
          setParseErrorToast(t('parseErrorHelp'));
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
    setProgress(t('msgReaching'));
    setPaletteDiagnostics(lastCrawlerResult.cssAnalysis?.paletteProfile?.diagnostics || null);
    setLastPaletteProfile(lastCrawlerResult.cssAnalysis?.paletteProfile || null);
    setThinkingSteps([
      { id: 'analyze', title: t('stepAnalyzeTitle'), description: t('stepAnalyzeDescRe'), status: 'in_progress' },
      { id: 'map', title: t('stepMapTitle'), description: t('stepMapDesc'), status: 'pending' },
      { id: 'generate', title: t('stepGenerateTitle'), description: t('stepGenerateDesc'), status: 'pending' },
    ]);
    try {
      await processContent(lastCrawlerResult, lastSource as FetcherService);
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

  const handleFolderContent = async (folderResult: { html: string; css: string; url: string }) => {
    if (!aiKey) {
      setError('Please provide your AI API key');
      return;
    }

    setIsProcessing(true);
    setError('');
    setProgress('Processing folder content...');
    setThemePackage(null);
    setHasCompleted(false);
    setPaletteDiagnostics(null);
    setCrawlerWarnings([]);
    saveSettings({ aiAssistedMapping: useAiMapping });

    setThinkingSteps([
      { id: 'parse', title: 'Parsing Folder', description: 'Reading HTML and CSS files', status: 'completed' },
      { id: 'analyze', title: 'AI Color Analysis', description: 'Analyzing color scheme with AI', status: 'in_progress' },
      { id: 'map', title: 'Mapping to Catppuccin', description: 'Mapping colors to Catppuccin palette', status: 'pending' },
      { id: 'generate', title: 'Generating Themes', description: 'Creating Stylus, LESS, and CSS themes', status: 'pending' },
    ]);

    try {
      // Build palette profile from folder content
      const { buildPaletteProfile } = await import('./services/palette-profile');
      const paletteProfile = buildPaletteProfile({
        url: folderResult.url,
        html: folderResult.html,
        css: folderResult.css,
      });

      // Create a CrawlerResult from folder content
      const crawlerResult: CrawlerResult = {
        url: folderResult.url,
        title: 'Local Folder',
        content: folderResult.html,
        html: folderResult.html,
        colors: [],
        cssAnalysis: {
          paletteProfile,
        },
      };

      setLastCrawlerResult(crawlerResult);
      setLastSource('direct-fetch');
      setPaletteDiagnostics(paletteProfile.diagnostics);
      setLastPaletteProfile(paletteProfile);
      setLastCrawlAt(new Date().toLocaleString());

      await processContent(crawlerResult, 'direct-fetch');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setProgress('');
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-ctp-base via-ctp-mantle to-ctp-crust text-ctp-text">
      <div className="pointer-events-none absolute inset-x-0 -top-24 h-80 bg-[radial-gradient(circle_at_top,rgba(var(--ctp-accent-rgb),0.22),transparent_60%)]" />
      <div className="pointer-events-none absolute -right-24 top-72 h-64 w-64 rounded-full bg-ctp-blue/20 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:py-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="rounded-full border border-ctp-surface2 bg-ctp-surface0/60 px-3 py-1 text-xs text-ctp-subtext1">
            {t('appTitle')}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-ctp-surface2 bg-ctp-surface0/80 px-3 py-2 text-sm text-ctp-text transition-colors hover:bg-ctp-surface1"
            >
              <Settings2 className="h-4 w-4" />
              {t('settings')}
            </button>
            <LanguageSelector />
            <ThemeSelector />
          </div>
        </div>

        <header className="mb-8 rounded-3xl border border-ctp-accent/30 bg-ctp-surface0/70 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr,1fr]">
            <div>
              <div className="mb-5 flex items-center gap-4">
                <img
                  src={catppuccinLogo}
                  alt="Catppuccin"
                  onError={(e) => {
                    console.error('Image failed to load:', e);
                    if (e.currentTarget instanceof HTMLImageElement) {
                      e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'%3E%3Crect width='100' height='100' fill='%2345475a'/%3E%3Ccircle cx='50' cy='50' r='40' fill='%23cba6f7'/%3E%3Cpath d='M30,30 L70,30 L70,70 L30,70 Z' fill='%23cba6f7'/%3E%3Cpath d='M40,40 L60,40 L60,60 L40,60 Z' fill='%23f5e0dc'/%3E%3C/svg%3E";
                    }
                  }}
                  className="h-16 w-16 rounded-2xl border border-ctp-surface2 shadow-lg shadow-ctp-accent/40 sm:h-20 sm:w-20"
                />
                <div>
                  <h1 className="bg-gradient-to-r from-ctp-accent to-ctp-mauve bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
                    {t('appHeading')}
                  </h1>
                  <p className="mt-1 text-ctp-subtext0">
                    {t('appSubheading')}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <a
                  href="https://github.com/catppuccin/catppuccin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ctp-lavender underline transition-colors hover:text-ctp-mauve"
                >
                  {t('catppuccinProject')}
                </a>
                <a
                  href="https://github.com/openstyles/stylus"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ctp-lavender underline transition-colors hover:text-ctp-mauve"
                >
                  {t('stylusExtension')}
                </a>
              </div>
            </div>

            <div className="grid gap-3 text-sm">
              <div className="rounded-xl border border-ctp-surface2 bg-ctp-mantle/80 p-4">
                <div className="text-xs uppercase tracking-wide text-ctp-subtext1">{t('aiAccess')}</div>
                <div className={`mt-1 font-semibold ${hasAiCredential ? 'text-ctp-green' : 'text-ctp-yellow'}`}>
                  {hasAiCredential ? t('configured') : t('needsApiKey')}
                </div>
                <div className="mt-1 text-xs text-ctp-subtext0">
                  {t('provider')} <span className="text-ctp-text">{aiProvider}</span>
                </div>
              </div>
              <div className="rounded-xl border border-ctp-surface2 bg-ctp-mantle/80 p-4">
                <div className="text-xs uppercase tracking-wide text-ctp-subtext1">{t('fetcherKeys')}</div>
                <div className="mt-1 font-semibold text-ctp-text">{t('configuredCount', { count: configuredFetcherKeyCount })}</div>
                <div className="mt-1 text-xs text-ctp-subtext0">
                  {t('service')} <span className="text-ctp-text">{fetcherService}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-ctp-accent/40 bg-ctp-accent/10 px-4 py-3 font-medium text-ctp-accent transition-colors hover:bg-ctp-accent/20"
              >
                <KeyRound className="h-4 w-4" />
                {t('openSettings')}
              </button>
            </div>
          </div>
        </header>

        <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="relative rounded-2xl border border-ctp-accent/30 bg-ctp-surface0/80 p-6 shadow-2xl backdrop-blur-sm">
              <h2 className="mb-2 text-2xl font-bold text-ctp-accent">{t('generateThemeHeading')}</h2>
              <p className="mb-4 text-sm text-ctp-subtext0">
                {t('generateThemeDesc')}
              </p>

              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ctp-text">{t('aiMappingDesc')}</p>
                  <p className="text-xs text-ctp-subtext0">
                    {t('aiMappingSubDesc')}
                  </p>
                </div>
                <label className="inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={useAiMapping}
                    onChange={(e) => {
                      setUseAiMapping(e.target.checked);
                      saveSettings({ aiAssistedMapping: e.target.checked });
                    }}
                  />
                  <div className="flex h-6 w-11 items-center rounded-full bg-ctp-surface2 px-1 transition peer-checked:bg-ctp-accent peer-focus:ring-2 peer-focus:ring-ctp-accent">
                    <div className="h-4 w-4 rounded-full bg-ctp-base transition-transform peer-checked:translate-x-5" />
                  </div>
                </label>
              </div>

              <InputSelector
                onURLSubmit={handleGenerate}
                onFolderContent={handleFolderContent}
                disabled={isProcessing}
                canRegenerate={canRegenerate}
              />

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleRegenerateFromCache}
                  disabled={!canQuickRerun || isProcessing}
                  className={`rounded-md border px-3 py-2 text-sm font-medium ${
                    canQuickRerun && !isProcessing
                      ? 'border-ctp-surface2 bg-ctp-surface1 text-ctp-text hover:bg-ctp-surface2'
                      : 'cursor-not-allowed border-ctp-surface2 bg-ctp-surface1/50 text-ctp-overlay1'
                  }`}
                  title={canQuickRerun ? t('rerunTooltip') : t('runCrawlFirst')}
                >
                  {t('rerunSameCrawl')}{lastCrawlerResult?.url ? ` (${new URL(lastCrawlerResult.url).hostname})` : ''}
                </button>
                {lastCrawlAt && (
                  <span className="text-xs text-ctp-subtext0">{t('lastCrawl')}{lastCrawlAt}</span>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-ctp-subtext0">
                <span className="font-semibold text-ctp-subtext1">{t('accentCoverage')}</span>
                <label className="inline-flex cursor-pointer items-center gap-1">
                  <input
                    type="checkbox"
                    checked={accentBadgeCardTable}
                    onChange={(e) => setAccentBadgeCardTable(e.target.checked)}
                    className="h-4 w-4 rounded border-ctp-surface2 text-ctp-accent focus:ring-ctp-accent"
                  />
                  <span>{t('badgesCardsTables')}</span>
                </label>
                <label className="inline-flex cursor-pointer items-center gap-1">
                  <input
                    type="checkbox"
                    checked={accentAlerts}
                    onChange={(e) => setAccentAlerts(e.target.checked)}
                    className="h-4 w-4 rounded border-ctp-surface2 text-ctp-accent focus:ring-ctp-accent"
                  />
                  <span>{t('alertsNotifications')}</span>
                </label>
              </div>

              {progress && (
                <div className="mt-4 rounded-lg border border-ctp-blue/30 bg-ctp-blue/10 px-3 py-2 text-sm text-ctp-blue">
                  {progress}
                </div>
              )}

              {error && (
                <div className="mt-4 rounded-lg border border-ctp-red/40 bg-ctp-red/10 px-3 py-2 text-sm text-ctp-red">
                  {error}
                </div>
              )}

              {crawlerWarnings.length > 0 && (
                <div className="mt-4 rounded-lg border border-ctp-surface2 bg-ctp-surface1/70 p-3 text-xs text-ctp-yellow">
                  {crawlerWarnings.map((w, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-ctp-yellow">•</span>
                      <span>{w}</span>
                    </div>
                  ))}
                  <div className="mt-1 text-ctp-subtext1">{t('fallbackWarning')}</div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {paletteDiagnostics && (
              <div className="rounded-2xl border border-ctp-surface2 bg-ctp-surface0/80 p-6 backdrop-blur-sm">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <h3 className="text-xl font-semibold text-ctp-accent">{t('paletteDiagnostics')}</h3>
                  <button
                    type="button"
                    onClick={handleDownloadPaletteProfile}
                    disabled={!lastPaletteProfile}
                    className={`rounded-md border px-3 py-1.5 text-xs ${
                      lastPaletteProfile
                        ? 'border-ctp-accent text-ctp-accent hover:bg-ctp-accent/10'
                        : 'cursor-not-allowed border-ctp-surface2 text-ctp-overlay1'
                    }`}
                    title={lastPaletteProfile ? t('downloadJsonUrl') : t('runCrawlDownload')}
                  >
                    {t('downloadJsonUrl')}
                  </button>
                </div>
                <div className="space-y-2 text-sm text-ctp-subtext0">
                  <p>
                    <span className="text-ctp-subtext1">{t('cssVariables')}</span>{' '}
                    <span className="text-ctp-text">{paletteDiagnostics.cssVariableCount}</span>
                  </p>
                  <p>
                    <span className="text-ctp-subtext1">{t('inferredRoles')}</span>{' '}
                    <span className="text-ctp-text">{paletteDiagnostics.inferredRoles.length}</span>
                  </p>
                  {paletteDiagnostics.warnings.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-medium text-ctp-yellow">{t('warnings')}</p>
                      <ul className="list-inside list-disc space-y-1">
                        {paletteDiagnostics.warnings.map((warning, idx) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                      <div className="space-y-1 text-xs text-ctp-subtext1">
                        <div className="font-semibold text-ctp-subtext0">{t('improveRecommendations')}</div>
                        <ul className="list-inside list-disc space-y-1">
                          <li>{t('rec1')}</li>
                          <li>{t('rec2')}</li>
                          <li>{t('rec3')}</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  {paletteDiagnostics.inferredRoles.slice(0, 10).length > 0 && (
                    <div>
                      <p className="font-medium text-ctp-subtext1">{t('sampleRoles')}</p>
                      <ul className="list-inside list-disc space-y-1">
                        {paletteDiagnostics.inferredRoles.slice(0, 10).map((role) => (
                          <li key={role}>{role}</li>
                        ))}
                      </ul>
                      {paletteDiagnostics.inferredRoles.length > 10 && (
                        <p className="text-xs text-ctp-overlay1">
                          {t('moreRoles', { count: paletteDiagnostics.inferredRoles.length - 10 })}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {(isProcessing || thinkingSteps.length > 0) && (
              <ThinkingProcess steps={thinkingSteps} />
            )}

            {!isProcessing && <ThemePreview themePackage={themePackage} />}
          </div>
        </div>

        {parseErrorToast && <ParseErrorToast message={parseErrorToast} />}

        <footer className="mt-12 pb-8 text-center text-sm text-ctp-overlay0">
          <p className="mb-2">
            {t('madeWith')}
            <a
              href="https://github.com/catppuccin/catppuccin"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 transition-colors hover:text-ctp-lavender"
            >
              {t('github')}
            </a>
          </p>
          <p className="mb-3 text-xs text-ctp-overlay1">
            {t('generatedBy')}<br />
            {t('modelsUsed')}
            Claude Opus 4.5, Claude Opus 4.1, Claude Sonnet 4.5, MiniMax M2, GPT 4.1, GPT 5,
            GPT 5 Codex, DeepSeek R1 0528 Qwen 3, Gemini 2.5 Pro
          </p>

          {version && (
            <div className="inline-flex items-center gap-2 rounded-lg border border-ctp-accent/20 bg-gradient-to-r from-ctp-accent/10 to-ctp-mauve/10 px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-ctp-accent">
                  v{version.version}
                </span>
                <span className="text-ctp-overlay1">•</span>
                <span className="text-xs text-ctp-overlay0">
                  {version.commitHash}
                </span>
                {version.branchName !== 'main' && (
                  <>
                    <span className="text-ctp-overlay1">•</span>
                    <span className="text-xs text-ctp-yellow">
                      {version.branchName}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </footer>
      </div>

      <div
        className={`fixed inset-0 z-50 transition ${isSettingsOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        aria-hidden={!isSettingsOpen}
      >
        <div
          className={`absolute inset-0 bg-ctp-crust/75 backdrop-blur-sm transition-opacity ${isSettingsOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsSettingsOpen(false)}
        />
        <div className="absolute inset-0 overflow-y-auto p-4 sm:p-8">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Settings panel"
            className={`mx-auto w-full max-w-6xl rounded-2xl border border-ctp-surface2 bg-ctp-base shadow-2xl transition-all ${isSettingsOpen ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}`}
          >
            <div className="flex items-center justify-between border-b border-ctp-surface1 px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-ctp-text">{t('settings')}</h2>
                <p className="text-sm text-ctp-subtext0">{t('settingsDesc')}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="rounded-lg border border-ctp-surface2 bg-ctp-surface0 p-2 text-ctp-subtext1 transition-colors hover:bg-ctp-surface1 hover:text-ctp-text"
                aria-label="Close settings"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div className="rounded-2xl border border-ctp-surface2 bg-ctp-surface0/80 p-6">
                <AIConfig
                  aiProvider={aiProvider}
                  onAIProviderChange={setAIProvider}
                  aiModel={aiModel}
                  onAIModelChange={setAIModel}
                  onKeyChange={(key) => setAIKey(key)}
                  onBaseUrlChange={(baseUrl) => setAIBaseUrl(baseUrl)}
                />
              </div>

              <div className="rounded-2xl border border-ctp-surface2 bg-ctp-surface0/80 p-6">
                <FetcherConfig
                  onConfigChange={(config) => {
                    setFetcherService(config.service);
                    setFetcherAPIKeys(config.apiKeys);
                  }}
                />
              </div>

              <div className="rounded-2xl border border-ctp-surface2 bg-ctp-surface0/80 p-6">
                <FontSelector
                  normalFont={normalFont}
                  monoFont={monoFont}
                  onNormalFontChange={(font) => {
                    setNormalFont(font);
                    saveSettings({ normalFont: font });
                  }}
                  onMonoFontChange={(font) => {
                    setMonoFont(font);
                    saveSettings({ monoFont: font });
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

// Simple toast for parse errors
/* eslint-disable jsx-a11y/no-redundant-roles */
function ParseErrorToast({ message }: { message: string }) {
  const { t } = useLanguage();
  return (
    <div
      role="alert"
      className="fixed bottom-6 right-6 z-50 max-w-sm bg-ctp-surface0 border border-ctp-red text-ctp-red px-4 py-3 rounded-lg shadow-lg"
    >
      <div className="font-semibold text-sm">{t('parseError')}</div>
      <div className="text-xs text-ctp-text">{message}</div>
    </div>
  );
}
