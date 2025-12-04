import { Globe } from 'lucide-react';
import { URLInput } from './URLInput';

interface InputSelectorProps {
  onURLSubmit: (url: string) => void;
  disabled?: boolean;
  canRegenerate?: boolean;
}

export function InputSelector({ onURLSubmit, disabled, canRegenerate }: InputSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-ctp-text">
          <Globe className="h-5 w-5 text-ctp-accent" />
          <div>
            <h3 className="text-lg font-semibold">URL-Based Crawler</h3>
            <p className="text-sm text-ctp-subtext0">
              Paste any public URL and we&apos;ll crawl it automatically using our HTTP fetcher or configured API services.
            </p>
          </div>
        </div>
        <URLInput onSubmit={onURLSubmit} disabled={disabled} canRegenerate={canRegenerate} />
      </div>
    </div>
  );
}
