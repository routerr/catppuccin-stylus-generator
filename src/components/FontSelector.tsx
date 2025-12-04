import { useState, useMemo, useCallback } from 'react';
import { Type, Code, Search, ChevronDown, X, GripVertical, Plus } from 'lucide-react';
import {
  NORMAL_TEXT_FONTS,
  MONOSPACE_FONTS,
  type FontOption,
  ALL_FONTS,
} from '../constants/fonts';

export interface FontSelectorProps {
  /** Comma-separated font families or JSON array string */
  normalFont: string;
  monoFont: string;
  onNormalFontChange: (family: string) => void;
  onMonoFontChange: (family: string) => void;
}

/** Parse font string to array of font families */
function parseFontFamilies(fontStr: string): string[] {
  if (!fontStr) return [];
  // Try to parse as JSON array first
  try {
    const parsed = JSON.parse(fontStr);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch {
    // Not JSON, treat as single font family
  }
  return fontStr ? [fontStr] : [];
}

/** Serialize font families array to string */
function serializeFontFamilies(families: string[]): string {
  if (families.length === 0) return '';
  if (families.length === 1) return families[0];
  return JSON.stringify(families);
}

/** Build CSS font-family string from array of FontOption families */
function buildCSSFontFamily(families: string[]): string {
  if (families.length === 0) return '';
  
  // Extract the core font names and build a proper fallback chain
  const fontParts: string[] = [];
  const seenFonts = new Set<string>();
  
  families.forEach((family) => {
    // Split by comma and add each part
    family.split(',').forEach((part) => {
      const trimmed = part.trim();
      if (trimmed && !seenFonts.has(trimmed.toLowerCase())) {
        seenFonts.add(trimmed.toLowerCase());
        fontParts.push(trimmed);
      }
    });
  });
  
  return fontParts.join(', ');
}

interface MultiFontDropdownProps {
  label: string;
  icon: React.ReactNode;
  fonts: FontOption[];
  selectedFamilies: string[];
  onFamiliesChange: (families: string[]) => void;
  placeholder: string;
}

function MultiFontDropdown({
  label,
  icon,
  fonts,
  selectedFamilies,
  onFamiliesChange,
  placeholder,
}: MultiFontDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const filteredFonts = useMemo(() => {
    // Filter out already selected fonts and the "keep original" option when there are selections
    const availableFonts = fonts.filter((font) => {
      if (font.family === '' && selectedFamilies.length > 0) return false;
      return !selectedFamilies.includes(font.family);
    });
    
    if (!searchQuery.trim()) return availableFonts;
    const query = searchQuery.toLowerCase();
    return availableFonts.filter(
      (font) =>
        font.name.toLowerCase().includes(query) ||
        font.family.toLowerCase().includes(query) ||
        font.category.toLowerCase().includes(query)
    );
  }, [fonts, searchQuery, selectedFamilies]);

  // Get FontOption for a family string
  const getFontOption = useCallback((family: string): FontOption | undefined => {
    return ALL_FONTS.find((f) => f.family === family);
  }, []);

  // Group fonts by category for better organization
  const groupedFonts = useMemo(() => {
    const groups: Record<string, FontOption[]> = {
      special: [],
      'sans-serif': [],
      serif: [],
      monospace: [],
      'nerd-fonts': [],
    };

    filteredFonts.forEach((font) => {
      if (font.family === '') {
        groups.special.push(font);
      } else if (font.isNerdFont) {
        groups['nerd-fonts'].push(font);
      } else {
        groups[font.category]?.push(font) ?? groups['sans-serif'].push(font);
      }
    });

    return groups;
  }, [filteredFonts]);

  const groupLabels: Record<string, string> = {
    special: '🔧 特殊選項',
    'sans-serif': '📝 Sans-Serif 無襯線',
    serif: '📖 Serif 襯線',
    monospace: '💻 Monospace 等寬',
    'nerd-fonts': '🤓 Nerd Fonts',
  };

  const handleAddFont = (family: string) => {
    if (family === '') {
      // "Keep original" clears all selections
      onFamiliesChange([]);
    } else {
      onFamiliesChange([...selectedFamilies, family]);
    }
    setSearchQuery('');
  };

  const handleRemoveFont = (index: number) => {
    const newFamilies = [...selectedFamilies];
    newFamilies.splice(index, 1);
    onFamiliesChange(newFamilies);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newFamilies = [...selectedFamilies];
    const draggedItem = newFamilies[draggedIndex];
    newFamilies.splice(draggedIndex, 1);
    newFamilies.splice(index, 0, draggedItem);
    onFamiliesChange(newFamilies);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newFamilies = [...selectedFamilies];
    [newFamilies[index - 1], newFamilies[index]] = [newFamilies[index], newFamilies[index - 1]];
    onFamiliesChange(newFamilies);
  };

  const handleMoveDown = (index: number) => {
    if (index === selectedFamilies.length - 1) return;
    const newFamilies = [...selectedFamilies];
    [newFamilies[index], newFamilies[index + 1]] = [newFamilies[index + 1], newFamilies[index]];
    onFamiliesChange(newFamilies);
  };

  return (
    <div className={`relative ${isOpen ? 'z-50' : ''}`}>
      <label className="flex items-center gap-2 text-sm font-medium text-ctp-subtext1 mb-2">
        {icon}
        {label}
      </label>

      {/* Selected fonts list */}
      {selectedFamilies.length > 0 && (
        <div className="mb-2 space-y-1">
          {selectedFamilies.map((family, index) => {
            const fontOption = getFontOption(family);
            return (
              <div
                key={`${family}-${index}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-2 px-3 py-2 bg-ctp-surface1 rounded-lg border border-ctp-surface2 group ${
                  draggedIndex === index ? 'opacity-50' : ''
                }`}
              >
                <GripVertical className="h-4 w-4 text-ctp-overlay0 cursor-grab active:cursor-grabbing flex-shrink-0" />
                <span className="text-xs text-ctp-overlay1 w-5 text-center flex-shrink-0">
                  {index + 1}
                </span>
                <span
                  className="flex-1 text-sm text-ctp-text truncate"
                  style={{ fontFamily: family }}
                >
                  {fontOption?.name || family}
                </span>
                {fontOption?.isNerdFont && (
                  <span className="px-1.5 py-0.5 text-xs bg-ctp-surface2 text-ctp-subtext0 rounded flex-shrink-0">
                    NF
                  </span>
                )}
                {fontOption?.googleFontsUrl && (
                  <span className="px-1.5 py-0.5 text-xs bg-ctp-blue/20 text-ctp-blue rounded flex-shrink-0">
                    G
                  </span>
                )}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="p-1 text-ctp-overlay1 hover:text-ctp-text disabled:opacity-30"
                    title="上移"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === selectedFamilies.length - 1}
                    className="p-1 text-ctp-overlay1 hover:text-ctp-text disabled:opacity-30"
                    title="下移"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveFont(index)}
                    className="p-1 text-ctp-overlay1 hover:text-ctp-red transition-colors"
                    title="移除"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add font button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-ctp-surface1 hover:bg-ctp-surface2 rounded-lg border border-ctp-surface2 border-dashed text-left transition-colors"
      >
        <span className="flex items-center gap-2 text-ctp-subtext0">
          <Plus className="h-4 w-4" />
          {selectedFamilies.length === 0 ? placeholder : '添加備用字體...'}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-ctp-overlay1 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close dropdown */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsOpen(false);
              setSearchQuery('');
            }}
          />

          {/* Dropdown menu */}
          <div className="absolute z-50 mt-2 w-full max-h-80 overflow-hidden bg-ctp-surface0 rounded-lg border border-ctp-surface2 shadow-xl">
            {/* Search input */}
            <div className="p-2 border-b border-ctp-surface2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ctp-overlay1" />
                <input
                  type="text"
                  placeholder="搜尋字體..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-ctp-surface1 border border-ctp-surface2 rounded-md text-sm text-ctp-text placeholder-ctp-overlay1 focus:outline-none focus:ring-2 focus:ring-ctp-accent"
                  autoFocus
                />
              </div>
            </div>

            {/* Font list */}
            <div className="max-h-60 overflow-y-auto">
              {/* Clear all option when fonts are selected */}
              {selectedFamilies.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onFamiliesChange([]);
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-ctp-surface1 transition-colors text-ctp-red border-b border-ctp-surface2"
                >
                  <div className="flex items-center gap-2">
                    <X className="h-4 w-4" />
                    <span>清除所有選擇（保持原樣）</span>
                  </div>
                </button>
              )}

              {Object.entries(groupedFonts).map(([group, groupFonts]) => {
                if (groupFonts.length === 0) return null;

                return (
                  <div key={group}>
                    <div className="px-3 py-2 text-xs font-semibold text-ctp-overlay1 bg-ctp-mantle sticky top-0">
                      {groupLabels[group] || group}
                    </div>
                    {groupFonts.map((font) => (
                      <button
                        key={font.family || 'no-change'}
                        type="button"
                        onClick={() => {
                          handleAddFont(font.family);
                          if (font.family === '') {
                            setIsOpen(false);
                          }
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-ctp-surface1 transition-colors text-ctp-text"
                        style={{
                          fontFamily: font.family || 'inherit',
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate">{font.name}</span>
                          <div className="flex items-center gap-1">
                            {font.isNerdFont && (
                              <span className="ml-2 px-1.5 py-0.5 text-xs bg-ctp-surface2 text-ctp-subtext0 rounded">
                                NF
                              </span>
                            )}
                            {font.googleFontsUrl && (
                              <span className="ml-2 px-1.5 py-0.5 text-xs bg-ctp-blue/20 text-ctp-blue rounded">
                                Google
                              </span>
                            )}
                          </div>
                        </div>
                        {font.family && (
                          <div className="text-xs text-ctp-subtext0 truncate mt-0.5">
                            {font.family}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                );
              })}

              {filteredFonts.length === 0 && (
                <div className="px-4 py-8 text-center text-ctp-overlay1">
                  {selectedFamilies.length > 0 && !searchQuery
                    ? '所有字體都已選擇'
                    : '找不到符合的字體'}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function FontSelector({
  normalFont,
  monoFont,
  onNormalFontChange,
  onMonoFontChange,
}: FontSelectorProps) {
  // Parse stored font strings to arrays
  const normalFamilies = useMemo(() => parseFontFamilies(normalFont), [normalFont]);
  const monoFamilies = useMemo(() => parseFontFamilies(monoFont), [monoFont]);

  // Build CSS font-family strings for preview
  const normalCSSFamily = useMemo(() => buildCSSFontFamily(normalFamilies), [normalFamilies]);
  const monoCSSFamily = useMemo(() => buildCSSFontFamily(monoFamilies), [monoFamilies]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-ctp-accent">Font Settings</h3>
        <span className="text-xs text-ctp-subtext0">
          選擇多個字體作為備用
        </span>
      </div>

      <div className="text-xs text-ctp-subtext0 bg-ctp-surface1/50 rounded-lg p-3 border border-ctp-surface2">
        <p className="mb-1">
          <span className="text-ctp-subtext1 font-medium">提示：</span>
          可選擇多個字體，依順序作為備用。拖曳或使用箭頭調整順序。
        </p>
        <p>
          Nerd Fonts 需要先在系統上安裝。Google Fonts 會自動匯入。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MultiFontDropdown
          label="一般文字字體"
          icon={<Type className="h-4 w-4" />}
          fonts={NORMAL_TEXT_FONTS}
          selectedFamilies={normalFamilies}
          onFamiliesChange={(families) => onNormalFontChange(serializeFontFamilies(families))}
          placeholder="(保持原樣)"
        />

        <MultiFontDropdown
          label="程式碼 / 等寬字體"
          icon={<Code className="h-4 w-4" />}
          fonts={MONOSPACE_FONTS}
          selectedFamilies={monoFamilies}
          onFamiliesChange={(families) => onMonoFontChange(serializeFontFamilies(families))}
          placeholder="(保持原樣)"
        />
      </div>

      {/* Preview section */}
      {(normalFamilies.length > 0 || monoFamilies.length > 0) && (
        <div className="mt-4 p-4 bg-ctp-mantle rounded-lg border border-ctp-surface2">
          <h4 className="text-sm font-medium text-ctp-subtext1 mb-3">預覽</h4>
          <div className="space-y-3">
            {normalFamilies.length > 0 && (
              <div>
                <div className="text-xs text-ctp-overlay1 mb-1">
                  一般文字 ({normalFamilies.length} 個字體)：
                </div>
                <p
                  className="text-ctp-text"
                  style={{ fontFamily: normalCSSFamily }}
                >
                  The quick brown fox jumps over the lazy dog. 敏捷的棕色狐狸跳過懶狗。
                </p>
                <div className="text-xs text-ctp-overlay0 mt-1 font-mono break-all">
                  font-family: {normalCSSFamily}
                </div>
              </div>
            )}
            {monoFamilies.length > 0 && (
              <div>
                <div className="text-xs text-ctp-overlay1 mb-1">
                  程式碼 ({monoFamilies.length} 個字體)：
                </div>
                <code
                  className="block p-2 bg-ctp-crust rounded text-ctp-text text-sm"
                  style={{ fontFamily: monoCSSFamily }}
                >
                  const greeting = &quot;Hello, 世界!&quot;;
                </code>
                <div className="text-xs text-ctp-overlay0 mt-1 font-mono break-all">
                  font-family: {monoCSSFamily}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Export utility functions for use in generators
export { parseFontFamilies, serializeFontFamilies, buildCSSFontFamily };
