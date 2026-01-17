import { useState, useRef, useCallback } from 'react';
import { FolderOpen, FileText, AlertCircle, Upload, FileArchive } from 'lucide-react';
import JSZip from 'jszip';

interface FolderUploadProps {
  onFolderContent: (result: { html: string; css: string; url: string }) => void;
  disabled?: boolean;
}

export function FolderUpload({ onFolderContent, disabled }: FolderUploadProps) {
  const [error, setError] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [fileCount, setFileCount] = useState<{ html: number; css: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(async (files: File[]) => {
    setError('');
    setFileCount(null);
    setProcessing(true);

    try {
      const htmlFiles: { name: string; content: string }[] = [];
      const cssFiles: { name: string; content: string }[] = [];
      let baseFolderName = 'local-folder';

      // Check if it's a single zip file
      if (files.length === 1 && (files[0].name.endsWith('.zip') || files[0].type === 'application/zip')) {
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(files[0]);
        baseFolderName = files[0].name.replace('.zip', '');
        
        const entries = Object.entries(zipContent.files);
        for (const [path, file] of entries) {
          if (file.dir) continue;
          
          const lowerName = path.toLowerCase();
          if (lowerName.endsWith('.html') || lowerName.endsWith('.htm')) {
            htmlFiles.push({ name: path, content: await file.async('string') });
          } else if (lowerName.endsWith('.css')) {
            cssFiles.push({ name: path, content: await file.async('string') });
          }
        }
      } else {
        // Normal file processing (folder upload or multiple files)
        if (files.length > 0) {
          // Try to guess a folder name from the first file path if available
           baseFolderName = files[0].webkitRelativePath?.split('/')[0] || 'uploaded-files';
        }

        for (const file of files) {
          const name = file.name.toLowerCase();
          if (name.endsWith('.html') || name.endsWith('.htm')) {
            htmlFiles.push({ name: file.name, content: await file.text() });
          } else if (name.endsWith('.css')) {
            cssFiles.push({ name: file.name, content: await file.text() });
          }
        }
      }

      if (htmlFiles.length === 0) {
        throw new Error('No HTML files found. Please upload a folder or zip containing at least one .html file.');
      }

      setFileCount({ html: htmlFiles.length, css: cssFiles.length });

      // Find main HTML file (prefer index.html or similar)
      const mainHtml = htmlFiles.find(f => f.name.toLowerCase().includes('index.html')) || htmlFiles[0];
      const combinedCss = cssFiles.map(f => `/* ${f.name} */\n${f.content}`).join('\n\n');

      onFolderContent({
        html: mainHtml.content,
        css: combinedCss,
        url: `file://${baseFolderName}/${mainHtml.name}`
      });
    } catch (err) {
      console.error('Upload processing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process files. Please try again.');
    } finally {
      setProcessing(false);
    }
  }, [onFolderContent]);

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragActive(true);
  }, [disabled]);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (disabled || e.dataTransfer.files.length === 0) return;
    
    // Convert FileList to Array
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  }, [disabled, processFiles]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        // @ts-expect-error webkitdirectory is not in standard types but supported
        webkitdirectory=""
        directory=""
        multiple
        onChange={handleInputChange}
        disabled={disabled || processing}
        className="hidden"
      />

      <div
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          relative w-full border-2 border-dashed rounded-xl p-8 transition-all duration-200 cursor-pointer group
          ${isDragActive 
            ? 'border-ctp-accent bg-ctp-accent/10 scale-[1.01]' 
            : 'border-ctp-surface2 hover:border-ctp-accent hover:bg-ctp-surface0/50'}
          ${(disabled || processing) ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
        `}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div className={`
            p-4 rounded-full transition-colors duration-200
            ${isDragActive ? 'bg-ctp-accent text-ctp-base' : 'bg-ctp-surface1 text-ctp-overlay1 group-hover:text-ctp-accent group-hover:bg-ctp-surface2'}
          `}>
             {processing ? (
               <div className="animate-spin h-8 w-8 border-4 border-current border-t-transparent rounded-full" />
             ) : isDragActive ? (
               <Upload className="h-8 w-8" />
             ) : (
               <div className="flex gap-2">
                 <FolderOpen className="h-8 w-8" />
                 <FileArchive className="h-8 w-8" />
               </div>
             )}
          </div>
          
          <div>
            <p className="text-lg font-medium text-ctp-text mb-1">
              {processing ? 'Processing files...' : isDragActive ? 'Drop content here' : 'Drop folder or zip here'}
            </p>
            <p className="text-sm text-ctp-subtext0">
              {processing 
                ? 'Parsing HTML and CSS content' 
                : 'Or click to select a folder (supports .zip)'}
            </p>
          </div>
        </div>
      </div>

      {fileCount && !processing && (
        <div className="flex items-center gap-4 p-3 bg-ctp-green/10 border border-ctp-green/20 rounded-lg animate-fade-in">
          <FileText className="h-5 w-5 text-ctp-green" />
          <span className="text-sm text-ctp-text">
            Extracted <strong className="text-ctp-green">{fileCount.html} HTML</strong> and <strong className="text-ctp-teal">{fileCount.css} CSS</strong> files
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-ctp-red/10 border border-ctp-red/30 rounded-lg animate-fade-in">
          <AlertCircle className="h-5 w-5 text-ctp-red flex-shrink-0" />
          <p className="text-sm text-ctp-red">{error}</p>
        </div>
      )}
    </div>
  );
}
