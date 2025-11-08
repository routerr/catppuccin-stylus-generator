import { useState, useRef } from 'react';
import { Upload, File, X } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function FileUpload({ onFileSelect, disabled }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    const validExtensions = ['.mhtml', '.mht'];
    const fileName = file.name.toLowerCase();
    
    if (!validExtensions.some(ext => fileName.endsWith(ext))) {
      setError('Please select a valid MHTML file (.mhtml or .mht)');
      return false;
    }

    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File size must be less than 50MB');
      return false;
    }

    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    if (validateFile(file)) {
      setSelectedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setError('');
    if (validateFile(file)) {
      setSelectedFile(file);
      // Update file input
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInputRef.current.files = dataTransfer.files;
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select an MHTML file');
      return;
    }
    onFileSelect(selectedFile);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-ctp-subtext1 mb-2">
          MHTML File
        </label>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative border-2 border-dashed rounded-lg p-6 transition-all duration-200
            ${isDragging
              ? 'border-ctp-accent bg-ctp-accent/20'
              : 'border-ctp-surface2 bg-ctp-surface1/30'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-ctp-accent hover:bg-ctp-surface1/50'}
          `}
          onClick={!disabled && !selectedFile ? handleBrowseClick : undefined}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".mhtml,.mht"
            onChange={handleFileChange}
            disabled={disabled}
            className="hidden"
          />

          {selectedFile ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <File className="h-8 w-8 text-ctp-accent" />
                <div>
                  <p className="text-ctp-text font-medium">{selectedFile.name}</p>
                  <p className="text-ctp-subtext0 text-sm">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile();
                  }}
                  className="p-2 hover:bg-ctp-surface2 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-ctp-overlay1 hover:text-ctp-text" />
                </button>
              )}
            </div>
          ) : (
            <div className="text-center">
              <Upload className="h-12 w-12 text-ctp-overlay1 mx-auto mb-3" />
              <p className="text-ctp-text font-medium mb-1">
                Drop your MHTML file here
              </p>
              <p className="text-ctp-subtext0 text-sm mb-2">
                or click to browse
              </p>
              <p className="text-ctp-overlay0 text-xs">
                Supports .mhtml and .mht files (max 50MB)
              </p>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-2 text-sm text-ctp-red">{error}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={disabled || !selectedFile}
        className="w-full bg-gradient-to-r from-ctp-accent to-ctp-bi-accent hover:opacity-90 text-ctp-base font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
      >
        {disabled ? 'Processing...' : 'Generate Theme from MHTML'}
      </button>
    </form>
  );
}