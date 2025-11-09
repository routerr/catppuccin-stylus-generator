// LocalStorage utilities for API keys and settings

interface StoredKeys {
  browserbase?: string;
  exa?: string;
  firecrawl?: string;
  brave?: string;
  openrouter?: string;
  chutes?: string;
  // Ollama Cloud API key
  ollama?: string;
  // Custom base URL for Ollama (e.g., https://your-tunnel.example.com)
  ollamaBase?: string;
}

const STORAGE_KEY = 'catppuccin-theme-gen-keys';

export function saveAPIKeys(keys: StoredKeys): void {
  try {
    // Basic encoding (NOT encryption - just obfuscation)
    const encoded = btoa(JSON.stringify(keys));
    localStorage.setItem(STORAGE_KEY, encoded);
  } catch (error) {
    console.error('Failed to save API keys:', error);
  }
}

export function loadAPIKeys(): StoredKeys {
  try {
    const encoded = localStorage.getItem(STORAGE_KEY);
    if (!encoded) return {};
    const decoded = atob(encoded);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to load API keys:', error);
    return {};
  }
}

export function clearAPIKeys(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// Convenience helpers specifically for Ollama base URL
export function getOllamaBaseFromStorage(): string | undefined {
  const keys = loadAPIKeys();
  return keys.ollamaBase;
}

export function setOllamaBaseInStorage(url: string | undefined): void {
  const keys = loadAPIKeys();
  const next = { ...keys, ollamaBase: url } as any;
  saveAPIKeys(next);
}

export function downloadJSON(data: any, filename: string): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export function downloadText(content: string, filename: string, mimeType: string = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
