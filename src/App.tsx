import { useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { URLInput } from './components/URLInput';
import { APIKeyConfig } from './components/APIKeyConfig';
import { ServiceSelector } from './components/ServiceSelector';
import { ThemePreview } from './components/ThemePreview';
import type { AIProvider, ThemePackage } from './types/theme';
import { fetchWebsiteContent } from './services/fetcher';
import { analyzeWebsiteColors } from './services/ai';
import { createUserStylePackage } from './services/generators';

function App() {
  const [aiProvider, setAIProvider] = useState<AIProvider>('openrouter');
  const [aiModel, setAIModel] = useState('google/gemma-2-9b-it:free');
  const [aiKey, setAIKey] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [themePackage, setThemePackage] = useState<ThemePackage | null>(null);

  const handleGenerate = async (url: string) => {
    if (!aiKey) {
      setError('Please provide your AI API key');
      return;
    }

    setIsProcessing(true);
    setError('');
    setProgress('Starting...');

    try {
      // Step 1: Fetch website content directly
      setProgress('Fetching website content...');
      const fetchResult = await fetchWebsiteContent(url);

      if (fetchResult.error) {
        throw new Error(`Failed to fetch website: ${fetchResult.error}`);
      }

      // Convert to crawler-compatible format
      const crawlerResult = {
        url: fetchResult.url,
        title: fetchResult.title,
        content: fetchResult.html,
        html: fetchResult.html,
        colors: fetchResult.colors,
      };

      // Step 2: Analyze colors with AI
      setProgress('Analyzing colors with AI...');
      const { analysis, mappings } = await analyzeWebsiteColors(crawlerResult, {
        provider: aiProvider,
        apiKey: aiKey,
        model: aiModel,
      });

      // Step 3: Generate UserStyle theme
      setProgress('Generating UserStyle theme...');
      const pkg = createUserStylePackage(
        url,
        mappings,
        analysis.accentColors,
        'direct-fetch',
        aiModel
      );

      setThemePackage(pkg);
      setProgress('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setProgress('');
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
          <p className="text-green-300 text-sm mt-2">
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
              <URLInput onSubmit={handleGenerate} disabled={isProcessing} />
            </div>
          </div>

          {/* Right Column - Preview */}
          <div>
            {isProcessing && (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-gray-700 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-purple-400 mx-auto mb-4" />
                <p className="text-gray-300 text-lg">{progress}</p>
              </div>
            )}

            {error && (
              <div className="bg-red-900/30 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-red-500/50 mb-6">
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
          <p>
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
        </footer>
      </div>
    </div>
  );
}

export default App;
