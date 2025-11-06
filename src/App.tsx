import { useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { InputSelector } from './components/InputSelector';
import { APIKeyConfig } from './components/APIKeyConfig';
import { ServiceSelector } from './components/ServiceSelector';
import { ThemePreview } from './components/ThemePreview';
import { ThinkingProcess, type ThinkingStep } from './components/ThinkingProcess';
import type { AIProvider, ThemePackage, CrawlerResult } from './types/theme';
import { fetchWebsiteContent } from './services/fetcher';
import { analyzeWebsiteColors } from './services/ai';
import { createUserStylePackage } from './services/generators';
import { MHTMLParser } from './utils/mhtml-parser';
import { parseWebpageDirectory, groupCSSClassesByPurpose } from './utils/directory-parser';

function App() {
  const [aiProvider, setAIProvider] = useState<AIProvider>('openrouter');
  const [aiModel, setAIModel] = useState('google/gemma-2-9b-it:free');
  const [aiKey, setAIKey] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [themePackage, setThemePackage] = useState<ThemePackage | null>(null);
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);

  const updateStep = (id: string, updates: Partial<ThinkingStep>) => {
    setThinkingSteps(prev => prev.map(step =>
      step.id === id ? { ...step, ...updates, timestamp: Date.now() } : step
    ));
  };

  const addStep = (step: ThinkingStep) => {
    setThinkingSteps(prev => [...prev, { ...step, timestamp: Date.now() }]);
  };

  const handleGenerate = async (url: string) => {
    if (!aiKey) {
      setError('Please provide your AI API key');
      return;
    }

    setIsProcessing(true);
    setError('');
    setProgress('Starting...');
    setThemePackage(null);

    // Initialize thinking steps
    setThinkingSteps([
      { id: 'fetch', title: 'Fetching Website', description: 'Downloading website content and extracting colors', status: 'in_progress' },
      { id: 'analyze', title: 'AI Color Analysis', description: 'Analyzing color scheme with AI', status: 'pending' },
      { id: 'map', title: 'Mapping to Catppuccin', description: 'Mapping colors to Catppuccin palette', status: 'pending' },
      { id: 'generate', title: 'Generating Themes', description: 'Creating Stylus, LESS, and CSS themes', status: 'pending' },
    ]);

    try {
      // Step 1: Fetch website content directly
      setProgress('Fetching website content...');
      const fetchResult = await fetchWebsiteContent(url);

      if (fetchResult.error) {
        updateStep('fetch', { status: 'error', details: fetchResult.error });
        throw new Error(`Failed to fetch website: ${fetchResult.error}`);
      }

      updateStep('fetch', {
        status: 'completed',
        details: `Found ${fetchResult.colors.length} colors from ${fetchResult.title}`
      });

      // Convert to crawler-compatible format
      const crawlerResult: CrawlerResult = {
        url: fetchResult.url,
        title: fetchResult.title,
        content: fetchResult.html,
        html: fetchResult.html,
        colors: fetchResult.colors,
      };

      await processContent(crawlerResult, 'direct-fetch');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setProgress('');
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!aiKey) {
      setError('Please provide your AI API key');
      return;
    }

    setIsProcessing(true);
    setError('');
    setProgress('Starting...');
    setThemePackage(null);

    // Initialize thinking steps
    setThinkingSteps([
      { id: 'parse', title: 'Parsing MHTML File', description: 'Extracting website content from file', status: 'in_progress' },
      { id: 'analyze', title: 'AI Color Analysis', description: 'Analyzing color scheme with AI', status: 'pending' },
      { id: 'map', title: 'Mapping to Catppuccin', description: 'Mapping colors to Catppuccin palette', status: 'pending' },
      { id: 'generate', title: 'Generating Themes', description: 'Creating Stylus, LESS, and CSS themes', status: 'pending' },
    ]);

    try {
      // Step 1: Parse MHTML file
      setProgress('Parsing MHTML file...');
      const crawlerResult = await MHTMLParser.parseFile(file);

      updateStep('parse', {
        status: 'completed',
        details: `Parsed ${file.name} - Found ${crawlerResult.colors.length} colors`
      });

      await processContent(crawlerResult, 'mhtml-upload');
    } catch (err) {
      updateStep('parse', { status: 'error', details: err instanceof Error ? err.message : 'Parse failed' });
      setError(err instanceof Error ? err.message : 'An error occurred');
      setProgress('');
      setIsProcessing(false);
    }
  };

  const handleDirectoryUpload = async (files: FileList) => {
    if (!aiKey) {
      setError('Please provide your AI API key');
      return;
    }

    setIsProcessing(true);
    setError('');
    setProgress('Starting...');
    setThemePackage(null);

    // Initialize thinking steps with CSS analysis
    setThinkingSteps([
      { id: 'parse', title: 'Analyzing Directory', description: 'Parsing HTML and CSS files from directory', status: 'in_progress' },
      { id: 'css-analyze', title: 'CSS Class Analysis', description: 'Identifying CSS classes and their usage', status: 'pending' },
      { id: 'analyze', title: 'AI Color & Class Mapping', description: 'Analyzing colors and generating class-specific mappings', status: 'pending' },
      { id: 'map', title: 'Mapping to Catppuccin', description: 'Creating detailed color and class mappings', status: 'pending' },
      { id: 'generate', title: 'Generating Enhanced Theme', description: 'Creating theme with class-specific rules', status: 'pending' },
    ]);

    try {
      // Step 1: Parse directory
      setProgress('Analyzing webpage directory...');
      const analysis = await parseWebpageDirectory(files);

      updateStep('parse', {
        status: 'completed',
        details: `Found ${analysis.colors.length} colors, ${analysis.cssClasses.length} CSS classes`
      });

      // Step 2: Group CSS classes
      updateStep('css-analyze', { status: 'in_progress' });
      setProgress('Analyzing CSS classes...');

      const groupedClasses = groupCSSClassesByPurpose(analysis.cssClasses);
      const totalClasses = Object.values(groupedClasses).reduce((sum, arr) => sum + arr.length, 0);

      updateStep('css-analyze', {
        status: 'completed',
        details: `Categorized ${totalClasses} classes: ${groupedClasses.buttons.length} buttons, ${groupedClasses.links.length} links, ${groupedClasses.backgrounds.length} backgrounds`
      });

      // Convert to CrawlerResult format with enhanced data
      const crawlerResult: CrawlerResult & { cssAnalysis?: any } = {
        url: 'local-directory',
        title: analysis.title,
        content: analysis.html,
        html: analysis.html,
        colors: analysis.colors,
        cssAnalysis: {
          classes: analysis.cssClasses,
          grouped: groupedClasses,
          inlineStyles: analysis.inlineStyles,
          linkedStyles: analysis.linkedStyles,
          structure: analysis.structure,
        },
      };

      await processContent(crawlerResult, 'directory-upload');
    } catch (err) {
      const currentStep = thinkingSteps.find(s => s.status === 'in_progress');
      if (currentStep) {
        updateStep(currentStep.id, {
          status: 'error',
          details: err instanceof Error ? err.message : 'Parse failed'
        });
      }
      setError(err instanceof Error ? err.message : 'An error occurred');
      setProgress('');
      setIsProcessing(false);
    }
  };

  const processContent = async (crawlerResult: CrawlerResult, source: string) => {
    try {
      // Step 2: Analyze colors with AI
      updateStep('analyze', { status: 'in_progress' });
      setProgress('Analyzing colors with AI...');

      const { analysis, mappings } = await analyzeWebsiteColors(crawlerResult, {
        provider: aiProvider,
        apiKey: aiKey,
        model: aiModel,
      });

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

      const pkg = createUserStylePackage(
        crawlerResult.url,
        mappings,
        analysis.accentColors,
        source as any,
        aiModel,
        (crawlerResult as any).cssAnalysis
      );

      updateStep('generate', {
        status: 'completed',
        details: 'Generated themes for Latte, Frappé, Macchiato, and Mocha'
      });

      setThemePackage(pkg);
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
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-purple-900/30 text-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
            Catppuccin Theme Generator
          </h1>
          <p className="text-gray-300 text-lg">
            Analyze any website and generate beautiful Catppuccin themes in Stylus, LESS, and CSS
          </p>
          <p className="grass-green-text text-sm mt-2">
            ✨ Now with direct HTTP fetching - no external crawler needed! Just AI API key required.
          </p>
          <a
            href="https://github.com/catppuccin/catppuccin"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-sm text-purple-300 hover:text-purple-200 underline"
          >
            Learn more about Catppuccin
          </a>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left Column - Configuration */}
          <div className="space-y-6">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-gray-700">
              <h2 className="text-2xl font-bold mb-6">AI Configuration</h2>

              <ServiceSelector
                aiProvider={aiProvider}
                onAIProviderChange={setAIProvider}
                aiModel={aiModel}
                onAIModelChange={setAIModel}
              />
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-gray-700">
              <APIKeyConfig
                aiProvider={aiProvider}
                onKeyChange={(key) => setAIKey(key)}
              />
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-gray-700">
              <h2 className="text-2xl font-bold mb-6">Generate Theme</h2>
              <InputSelector
                onURLSubmit={handleGenerate}
                onFileSelect={handleFileUpload}
                onDirectorySelect={handleDirectoryUpload}
                disabled={isProcessing}
              />
            </div>
          </div>

          {/* Right Column - Preview & Thinking Process */}
          <div className="space-y-6">
            {/* Thinking Process Display */}
            {(isProcessing || thinkingSteps.length > 0) && (
              <ThinkingProcess steps={thinkingSteps} />
            )}

            {error && (
              <div className="bg-red-900/30 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-red-500/50">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-300 mb-2">Error</h3>
                    <p className="text-red-200">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {!isProcessing && <ThemePreview themePackage={themePackage} />}
          </div>
        </div>

        <footer className="text-center text-gray-500 text-sm mt-12 pb-8">
          <p className="mb-2">
            Made with Catppuccin |
            <a
              href="https://github.com/catppuccin/catppuccin"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 hover:text-purple-400"
            >
              GitHub
            </a>
          </p>
          <p className="text-gray-600 text-xs">
            Generated by Claude Code, Roo Code, MiniMax M2
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
