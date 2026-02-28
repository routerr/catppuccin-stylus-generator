import { useState } from 'react';
import { Download, FileCode, Copy, Check } from 'lucide-react';
import type { ThemePackage } from '../types/theme';
import { CATPPUCCIN_PALETTES, FLAVORS } from '../constants/catppuccin-colors';
import { downloadText } from '../utils/storage';
import { useLanguage } from '../hooks/useLanguage';

interface ThemePreviewProps {
  themePackage: ThemePackage | null;
}

export function ThemePreview({ themePackage }: ThemePreviewProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!themePackage) {
    return (
      <div className="bg-ctp-surface0/80 backdrop-blur-sm rounded-2xl p-8 text-center border border-ctp-surface2">
        <FileCode className="h-16 w-16 text-ctp-overlay0 mx-auto mb-4" />
        <p className="text-ctp-subtext0">{t('noThemeGenerated')}</p>
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
          <h2 className="text-2xl font-bold text-ctp-text mb-2">{t('generatedThemeHeading')}</h2>
          <p className="text-ctp-subtext1 mb-2">
            {t('generatedFrom')} <span className="text-ctp-accent">{themePackage.url}</span>
          </p>
          <p className="text-sm text-ctp-subtext0 mb-4">
            {t('themeSupportsFlavors')}
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleDownloadUserStyle}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-ctp-accent to-ctp-bi-accent hover:opacity-90 rounded-lg transition-opacity text-ctp-base font-medium"
            >
              <Download className="h-4 w-4" />
              {t('downloadUserStyle')}
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 bg-ctp-surface1 hover:bg-ctp-surface2 rounded-lg transition-colors text-ctp-text"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? t('copied') : t('copyClipboard')}
            </button>
          </div>
        </div>

        {/* Flavor Previews */}
        <div className="bg-ctp-surface0/80 backdrop-blur-sm rounded-xl p-6 border border-ctp-surface2">
          <h3 className="text-lg font-bold text-ctp-text mb-4">{t('catppuccinFlavors')}</h3>
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
          <h3 className="text-lg font-bold text-ctp-text mb-4">{t('codePreview')}</h3>
          <div className="overflow-x-auto max-h-96 overflow-y-auto bg-ctp-mantle/50 rounded-lg p-4 border border-ctp-surface1">
            <pre className="text-sm leading-6 text-ctp-text font-mono m-0 bg-transparent whitespace-pre">
              <code className="text-ctp-text">{themePackage.userStyle}</code>
            </pre>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-ctp-blue/20 border border-ctp-blue/30 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-ctp-blue mb-2">{t('howToUse')}</h4>
          <ol className="text-sm text-ctp-blue space-y-1 list-decimal list-inside">
            <li>{t('instructions1')}</li>
            <li>{t('instructions2')}</li>
            <li>{t('instructions3')}</li>
            <li>{t('instructions4')}</li>
            <li>{t('instructions5')}</li>
          </ol>
        </div>

        {/* Metadata */}
        <div className="bg-ctp-surface0/50 rounded-lg p-4 border border-ctp-surface2">
          <h4 className="text-sm font-semibold text-ctp-subtext1 mb-2">{t('generationInfo')}</h4>
          <div className="text-sm text-ctp-subtext0 space-y-1">
            <p>{t('source')} <span className="text-ctp-text">
              {themePackage.metadata.crawlerUsed === 'direct-fetch' && 'Direct HTTP Fetch'}
              {themePackage.metadata.crawlerUsed === 'playwright-crawler' && 'Playwright Crawler'}
            </span></p>
            <p>{t('aiModelUsed')} <span className="text-ctp-text">{themePackage.metadata.aiModelUsed}</span></p>
            <p>{t('generatedAt')} <span className="text-ctp-text">{new Date(themePackage.timestamp).toLocaleString()}</span></p>
            <p>{t('accentColorsDetected')} <span className="text-ctp-text">{themePackage.metadata.accentColors.join(', ')}</span></p>
          </div>
        </div>
      </div>
    );
  }

  // Fallback: Old multi-theme format (for backward compatibility)
  return (
    <div className="bg-ctp-surface0/80 backdrop-blur-sm rounded-2xl p-8 text-center border border-ctp-surface2">
      <FileCode className="h-16 w-16 text-ctp-overlay0 mx-auto mb-4" />
      <p className="text-ctp-subtext0">{t('oldFormatWarning')}</p>
    </div>
  );
}
