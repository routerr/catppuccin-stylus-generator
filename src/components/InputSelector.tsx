import { useState } from 'react';
import { Globe, Upload, FolderOpen } from 'lucide-react';
import { URLInput } from './URLInput';
import { FileUpload } from './FileUpload';
import { DirectoryUpload } from './DirectoryUpload';

interface InputSelectorProps {
  onURLSubmit: (url: string) => void;
  onFileSelect: (file: File) => void;
  onDirectorySelect: (files: FileList) => void;
  disabled?: boolean;
}

export function InputSelector({ onURLSubmit, onFileSelect, onDirectorySelect, disabled }: InputSelectorProps) {
  const [activeTab, setActiveTab] = useState<'url' | 'file' | 'directory'>('url');

  return (
    <div className="space-y-4">
      {/* Tab Buttons */}
      <div className="flex gap-2 p-1 bg-gray-700/30 rounded-lg">
        <button
          type="button"
          onClick={() => setActiveTab('url')}
          disabled={disabled}
          className={`
            flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md font-medium transition-all duration-200
            ${activeTab === 'url'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <Globe className="h-4 w-4" />
          <span>URL</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('file')}
          disabled={disabled}
          className={`
            flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md font-medium transition-all duration-200
            ${activeTab === 'file'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <Upload className="h-4 w-4" />
          <span>MHTML</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('directory')}
          disabled={disabled}
          className={`
            flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md font-medium transition-all duration-200
            ${activeTab === 'directory'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <FolderOpen className="h-4 w-4" />
          <span>Directory</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === 'url' ? (
          <URLInput onSubmit={onURLSubmit} disabled={disabled} />
        ) : activeTab === 'file' ? (
          <FileUpload onFileSelect={onFileSelect} disabled={disabled} />
        ) : (
          <DirectoryUpload onDirectorySelect={onDirectorySelect} disabled={disabled} />
        )}
      </div>
    </div>
  );
}