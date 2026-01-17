import { useState } from 'react';
import { Globe, FolderOpen } from 'lucide-react';
import { URLInput } from './URLInput';
import { FolderUpload } from './FolderUpload';

type InputMode = 'url' | 'folder';

interface InputSelectorProps {
  onURLSubmit: (url: string) => void;
  onFolderContent: (result: { html: string; css: string; url: string }) => void;
  disabled?: boolean;
  canRegenerate?: boolean;
}

export function InputSelector({ onURLSubmit, onFolderContent, disabled, canRegenerate }: InputSelectorProps) {
  const [mode, setMode] = useState<InputMode>('url');

  return (
    <div className="space-y-4">
      {/* Tab Switch */}
      <div className="flex border border-ctp-surface2 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setMode('url')}
          disabled={disabled}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 transition-all duration-200 ${
            mode === 'url'
              ? 'bg-ctp-accent text-ctp-base font-semibold'
              : 'bg-ctp-surface0 text-ctp-subtext0 hover:bg-ctp-surface1'
          } disabled:opacity-50`}
        >
          <Globe className="h-4 w-4" />
          URL
        </button>
        <button
          type="button"
          onClick={() => setMode('folder')}
          disabled={disabled}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 transition-all duration-200 ${
            mode === 'folder'
              ? 'bg-ctp-accent text-ctp-base font-semibold'
              : 'bg-ctp-surface0 text-ctp-subtext0 hover:bg-ctp-surface1'
          } disabled:opacity-50`}
        >
          <FolderOpen className="h-4 w-4" />
          Folder
        </button>
      </div>

      {/* Content */}
      {mode === 'url' ? (
        <div className="space-y-3">
          <p className="text-sm text-ctp-subtext0">
            Paste any public URL and we&apos;ll crawl it automatically.
          </p>
          <URLInput onSubmit={onURLSubmit} disabled={disabled} canRegenerate={canRegenerate} />
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-ctp-subtext0">
            Upload a downloaded website folder (e.g., from browser&apos;s "Save As Complete").
          </p>
          <FolderUpload onFolderContent={onFolderContent} disabled={disabled} />
        </div>
      )}
    </div>
  );
}
