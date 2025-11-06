import { useState } from 'react';
import { Globe, Upload } from 'lucide-react';
import { URLInput } from './URLInput';
import { FileUpload } from './FileUpload';

interface InputSelectorProps {
  onURLSubmit: (url: string) => void;
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function InputSelector({ onURLSubmit, onFileSelect, disabled }: InputSelectorProps) {
  const [activeTab, setActiveTab] = useState<'url' | 'file'>('url');

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
          <span>Upload MHTML</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === 'url' ? (
          <URLInput onSubmit={onURLSubmit} disabled={disabled} />
        ) : (
          <FileUpload onFileSelect={onFileSelect} disabled={disabled} />
        )}
      </div>
    </div>
  );
}