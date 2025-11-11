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
      <div className="bg-ctp-surface0/80 backdrop-blur-sm rounded-2xl p-8 text-center border border-ctp-surface2">
        <FileCode className="h-16 w-16 text-ctp-overlay0 mx-auto mb-4" />
        <p className="text-ctp-subtext0">No theme generated yet. Enter a URL above to get started!</p>
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
        <div className="bg-gradient-to-r from-ctp-accent/20 to-ctp-bi-accent/20 rounded-xl p-6 border border-ctp-accent/30">
          <h2 className="text-2xl font-bold text-ctp-text mb-2">Generated UserStyle Theme</h2>
          <p className="text-ctp-subtext1 mb-2">
            Generated from: <span className="text-ctp-accent">{themePackage.url}</span>
          </p>
          <p className="text-sm text-ctp-subtext0 mb-4">
            This theme supports all 4 Catppuccin flavors with light/dark mode detection
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleDownloadUserStyle}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-ctp-accent to-ctp-bi-accent hover:opacity-90 rounded-lg transition-opacity text-ctp-base font-medium"
            >
              <Download className="h-4 w-4" />
              Download UserStyle (.less)
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 bg-ctp-surface1 hover:bg-ctp-surface2 rounded-lg transition-colors text-ctp-text"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
          </div>
        </div>

        {/* Flavor Previews */}
        <div className="bg-ctp-surface0/80 backdrop-blur-sm rounded-xl p-6 border border-ctp-surface2">
          <h3 className="text-lg font-bold text-ctp-text mb-4">Catppuccin Flavors</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FLAVORS.map((flavorInfo) => {
              const palette = CATPPUCCIN_PALETTES[flavorInfo.name];
              return (
                <div key={flavorInfo.name} className="space-y-2">
                  <h4 className="text-sm font-semibold text-ctp-text flex items-center gap-2">
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
        <div className="bg-ctp-surface0/80 backdrop-blur-sm rounded-xl p-6 border border-ctp-surface2">
          <h3 className="text-lg font-bold text-ctp-text mb-4">UserStyle Code Preview</h3>
          <div className="overflow-x-auto max-h-96 overflow-y-auto bg-ctp-mantle/50 rounded-lg p-4 border border-ctp-surface1">
            <pre className="text-sm leading-6 text-ctp-text font-mono m-0 bg-transparent whitespace-pre">
              <code className="text-ctp-text">{themePackage.userStyle}</code>
            </pre>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-ctp-blue/20 border border-ctp-blue/30 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-ctp-blue mb-2">How to Use</h4>
          <ol className="text-sm text-ctp-blue space-y-1 list-decimal list-inside">
            <li>Install a UserStyle manager (Stylus for Chrome/Firefox, or Cascadea for Safari)</li>
            <li>Download the .less file above</li>
            <li>In your UserStyle manager, create a new style and paste the code</li>
            <li>The theme will automatically adapt to light/dark mode</li>
            <li>Choose your preferred accent color in the UserStyle settings</li>
          </ol>
        </div>

        {/* Metadata */}
        <div className="bg-ctp-surface0/50 rounded-lg p-4 border border-ctp-surface2">
          <h4 className="text-sm font-semibold text-ctp-subtext1 mb-2">Generation Info</h4>
          <div className="text-sm text-ctp-subtext0 space-y-1">
            <p>Source: <span className="text-ctp-text">
              {themePackage.metadata.crawlerUsed === 'direct-fetch' && 'Direct HTTP Fetch'}
              {themePackage.metadata.crawlerUsed === 'mhtml-upload' && 'MHTML File Upload'}
              {themePackage.metadata.crawlerUsed === 'directory-upload' && 'Directory Upload'}
            </span></p>
            <p>AI Model: <span className="text-ctp-text">{themePackage.metadata.aiModelUsed}</span></p>
            <p>Generated: <span className="text-ctp-text">{new Date(themePackage.timestamp).toLocaleString()}</span></p>
            <p>Accent Colors Detected: <span className="text-ctp-text">{themePackage.metadata.accentColors.join(', ')}</span></p>
          </div>
        </div>
      </div>
    );
  }

  // Fallback: Old multi-theme format (for backward compatibility)
  return (
    <div className="bg-ctp-surface0/80 backdrop-blur-sm rounded-2xl p-8 text-center border border-ctp-surface2">
      <FileCode className="h-16 w-16 text-ctp-overlay0 mx-auto mb-4" />
      <p className="text-ctp-subtext0">Old theme format detected. Please regenerate the theme.</p>
    </div>
  );
}
