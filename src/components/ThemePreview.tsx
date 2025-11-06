import { useState } from 'react';
import { Download, FileCode, Copy, Check } from 'lucide-react';
import type { ThemePackage } from '../types/theme';
import { CATPPUCCIN_PALETTES, FLAVORS } from '../constants/catppuccin-colors';
import { downloadText } from '../utils/storage';

interface ThemePreviewProps {
  themePackage: ThemePackage | null;
}

export function ThemePreview({ themePackage }: ThemePreviewProps) {
  const [copied, setCopied] = useState(false);

  if (!themePackage) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 text-center border border-gray-700">
        <FileCode className="h-16 w-16 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400">No theme generated yet. Enter a URL above to get started!</p>
      </div>
    );
  }

  // UserStyle format
  if (themePackage.userStyle) {
    const handleDownloadUserStyle = () => {
      const url = new URL(themePackage.url);
      const siteName = url.hostname.replace('www.', '').split('.')[0];
      downloadText(themePackage.userStyle!, `catppuccin-${siteName}.user.less`, 'text/plain');
    };

    const handleCopy = async () => {
      await navigator.clipboard.writeText(themePackage.userStyle!);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl p-6 border border-purple-500/30">
          <h2 className="text-2xl font-bold text-white mb-2">Generated UserStyle Theme</h2>
          <p className="text-gray-300 mb-2">
            Generated from: <span className="text-purple-300">{themePackage.url}</span>
          </p>
          <p className="text-sm text-gray-400 mb-4">
            This theme supports all 4 Catppuccin flavors with light/dark mode detection
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleDownloadUserStyle}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              <Download className="h-4 w-4" />
              Download UserStyle (.less)
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
          </div>
        </div>

        {/* Flavor Previews */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-4">Catppuccin Flavors</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FLAVORS.map((flavorInfo) => {
              const palette = CATPPUCCIN_PALETTES[flavorInfo.name];
              return (
                <div key={flavorInfo.name} className="space-y-2">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <span>{flavorInfo.emoji}</span>
                    {flavorInfo.displayName}
                  </h4>
                  <div className="flex gap-1">
                    {['base', 'surface0', 'text', 'red', 'green', 'blue', 'mauve', 'pink'].map((colorName) => (
                      <div
                        key={colorName}
                        className="h-8 flex-1 rounded"
                        style={{ backgroundColor: palette[colorName as keyof typeof palette].hex }}
                        title={colorName}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Code Preview */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-4">UserStyle Code Preview</h3>
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto max-h-96 overflow-y-auto">
            <pre className="text-xs text-gray-300 font-mono">
              <code>{themePackage.userStyle}</code>
            </pre>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-200 mb-2">How to Use</h4>
          <ol className="text-sm text-blue-200 space-y-1 list-decimal list-inside">
            <li>Install a UserStyle manager (Stylus for Chrome/Firefox, or Cascadea for Safari)</li>
            <li>Download the .less file above</li>
            <li>In your UserStyle manager, create a new style and paste the code</li>
            <li>The theme will automatically adapt to light/dark mode</li>
            <li>Choose your preferred accent color in the UserStyle settings</li>
          </ol>
        </div>

        {/* Metadata */}
        <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
          <h4 className="text-sm font-semibold text-gray-300 mb-2">Generation Info</h4>
          <div className="text-sm text-gray-400 space-y-1">
            <p>Fetcher: <span className="text-white">{themePackage.metadata.crawlerUsed}</span></p>
            <p>AI Model: <span className="text-white">{themePackage.metadata.aiModelUsed}</span></p>
            <p>Generated: <span className="text-white">{new Date(themePackage.timestamp).toLocaleString()}</span></p>
            <p>Accent Colors Detected: <span className="text-white">{themePackage.metadata.accentColors.join(', ')}</span></p>
          </div>
        </div>
      </div>
    );
  }

  // Fallback: Old multi-theme format (for backward compatibility)
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 text-center border border-gray-700">
      <FileCode className="h-16 w-16 text-gray-500 mx-auto mb-4" />
      <p className="text-gray-400">Old theme format detected. Please regenerate the theme.</p>
    </div>
  );
}
