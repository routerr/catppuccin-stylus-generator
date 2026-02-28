import { Languages } from 'lucide-react';
import { LANGUAGE_OPTIONS } from '../i18n';
import { useLanguage } from '../hooks/useLanguage';

export function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <label className="inline-flex items-center gap-2 rounded-lg border border-ctp-surface1 bg-ctp-surface0 px-3 py-1.5 text-sm text-ctp-text">
      <Languages className="h-4 w-4 text-ctp-subtext0" />
      <span className="sr-only">{t('language')}</span>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as (typeof LANGUAGE_OPTIONS)[number]['code'])}
        title={t('changeLanguage')}
        className="bg-transparent text-sm text-ctp-text focus:outline-none"
      >
        {LANGUAGE_OPTIONS.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
