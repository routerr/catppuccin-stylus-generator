import { useRef, useState } from 'react';
import { FolderOpen, CheckCircle2 } from 'lucide-react';

interface DirectoryUploadProps {
  onDirectorySelect: (files: FileList) => void;
  disabled?: boolean;
  canRegenerate?: boolean;
}

export function DirectoryUpload({ onDirectorySelect, disabled, canRegenerate }: DirectoryUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Get the directory path from the first file
      const path = files[0].webkitRelativePath.split('/')[0];
      setSelectedPath(path);
      setSelectedFiles(files);
      // Auto-start generation when directory is selected
      onDirectorySelect(files);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles) {
      onDirectorySelect(selectedFiles);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-ctp-subtext1 mb-2">
          Webpage Directory
        </label>

        <div
          onClick={() => !disabled && inputRef.current?.click()}
          className={`
            border-2 border-dashed border-ctp-surface2 rounded-xl p-8
            flex flex-col items-center justify-center gap-3
            transition-all duration-200
            ${disabled
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer hover:border-ctp-accent hover:bg-ctp-surface1/30'
            }
            ${selectedPath ? 'border-ctp-green bg-ctp-green/10' : ''}
          `}
        >
          <input
            ref={inputRef}
            type="file"
            // @ts-ignore - webkitdirectory is not in the TypeScript types
            webkitdirectory=""
            directory=""
            multiple
            onChange={handleChange}
            disabled={disabled}
            className="hidden"
          />

          {selectedPath ? (
            <>
              <CheckCircle2 className="h-12 w-12 text-ctp-green" />
              <p className="text-ctp-green font-medium">Directory selected!</p>
              <p className="text-sm text-ctp-subtext0">{selectedPath}</p>
              <p className="text-xs text-ctp-overlay0 mt-2">
                Click again to select a different directory
              </p>
            </>
          ) : (
            <>
              <FolderOpen className="h-12 w-12 text-ctp-overlay1" />
              <p className="text-ctp-subtext1 font-medium">Select webpage directory</p>
              <p className="text-sm text-ctp-subtext0 text-center max-w-md">
                Choose a directory containing HTML file and assets folder
                <br />
                (Saved using "Webpage, Complete" in browser)
              </p>
            </>
          )}
        </div>
      </div>

      <div className="bg-ctp-blue/20 border border-ctp-blue/30 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-ctp-blue mb-2">💡 How to save a webpage directory:</h4>
        <ol className="text-xs text-ctp-subtext1 space-y-1 list-decimal list-inside">
          <li>Open the webpage you want to theme in your browser</li>
          <li>Press <code className="bg-ctp-base px-1 rounded">Ctrl+S</code> (or <code className="bg-ctp-base px-1 rounded">Cmd+S</code> on Mac)</li>
          <li>Select "Webpage, Complete" or "Web Page, Complete" as the save type</li>
          <li>Save it (creates an HTML file + a folder with assets)</li>
          <li>Click above to select the saved directory</li>
        </ol>
      </div>

      <div className="bg-ctp-accent/20 border border-ctp-accent/30 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-ctp-accent mb-2">✨ Advanced Analysis Features:</h4>
        <ul className="text-xs text-ctp-subtext1 space-y-1 list-disc list-inside">
          <li>Analyzes all CSS files and inline styles</li>
          <li>Identifies CSS class usage patterns</li>
          <li>Generates class-specific color mappings using AI</li>
          <li>Creates more precise and targeted theme rules</li>
        </ul>
      </div>

      {selectedFiles && !disabled && !canRegenerate && (
        <div className="bg-ctp-green/20 border border-ctp-green/30 rounded-lg p-3">
          <p className="text-sm text-ctp-subtext0">
            ✓ Directory uploaded - generation started automatically
          </p>
        </div>
      )}

      {disabled && (
        <div className="bg-ctp-blue/20 border border-ctp-blue/30 rounded-lg p-3">
          <p className="text-sm text-ctp-subtext0">
            ⏳ Processing theme with advanced CSS analysis... This may take a moment
          </p>
        </div>
      )}

      {canRegenerate && (
        <div className="bg-ctp-yellow/20 border border-ctp-yellow/30 rounded-lg p-3">
          <p className="text-sm text-ctp-subtext0">
            ⚡ AI config changed - click below to regenerate with new settings
          </p>
        </div>
      )}

      {canRegenerate && (
        <button
          type="submit"
          disabled={disabled || !selectedFiles}
          className="w-full bg-gradient-to-r from-ctp-accent to-ctp-bi-accent hover:opacity-90 text-ctp-base font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {disabled ? 'Processing...' : 'Regenerate Theme from Directory'}
        </button>
      )}
    </form>
  );
}
