import { useRef, useState } from 'react';
import { FolderOpen, CheckCircle2 } from 'lucide-react';

interface DirectoryUploadProps {
  onDirectorySelect: (files: FileList) => void;
  disabled?: boolean;
}

export function DirectoryUpload({ onDirectorySelect, disabled }: DirectoryUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedPath, setSelectedPath] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Get the directory path from the first file
      const path = files[0].webkitRelativePath.split('/')[0];
      setSelectedPath(path);
      onDirectorySelect(files);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        className={`
          border-2 border-dashed border-gray-600 rounded-xl p-8
          flex flex-col items-center justify-center gap-3
          transition-all duration-200
          ${disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer hover:border-purple-500 hover:bg-gray-800/30'
          }
          ${selectedPath ? 'border-green-500 bg-green-900/10' : ''}
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
            <CheckCircle2 className="h-12 w-12 text-green-400" />
            <p className="text-green-300 font-medium">Directory selected!</p>
            <p className="text-sm text-gray-400">{selectedPath}</p>
            <p className="text-xs text-gray-500 mt-2">
              Click again to select a different directory
            </p>
          </>
        ) : (
          <>
            <FolderOpen className="h-12 w-12 text-gray-400" />
            <p className="text-gray-300 font-medium">Select webpage directory</p>
            <p className="text-sm text-gray-400 text-center max-w-md">
              Choose a directory containing HTML file and assets folder
              <br />
              (Saved using "Webpage, Complete" in browser)
            </p>
          </>
        )}
      </div>

      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-300 mb-2">💡 How to save a webpage directory:</h4>
        <ol className="text-xs text-gray-300 space-y-1 list-decimal list-inside">
          <li>Open the webpage you want to theme in your browser</li>
          <li>Press <code className="bg-gray-800 px-1 rounded">Ctrl+S</code> (or <code className="bg-gray-800 px-1 rounded">Cmd+S</code> on Mac)</li>
          <li>Select "Webpage, Complete" or "Web Page, Complete" as the save type</li>
          <li>Save it (creates an HTML file + a folder with assets)</li>
          <li>Click above to select the saved directory</li>
        </ol>
      </div>

      <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-purple-300 mb-2">✨ Advanced Analysis Features:</h4>
        <ul className="text-xs text-gray-300 space-y-1 list-disc list-inside">
          <li>Analyzes all CSS files and inline styles</li>
          <li>Identifies CSS class usage patterns</li>
          <li>Generates class-specific color mappings using AI</li>
          <li>Creates more precise and targeted theme rules</li>
        </ul>
      </div>
    </div>
  );
}
