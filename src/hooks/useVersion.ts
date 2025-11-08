import { useState, useEffect } from 'react';

export interface VersionInfo {
  version: string;
  commitCount: number;
  commitHash: string;
  branchName: string;
  timestamp: string;
  buildDate: string;
}

/**
 * Hook to fetch version information from version.json
 * The version is auto-generated during build based on git commit count
 */
export function useVersion(): VersionInfo | null {
  const [version, setVersion] = useState<VersionInfo | null>(null);

  useEffect(() => {
    // Fetch version.json from public directory
    // Use Vite's base URL to work in both dev and production
    const versionPath = `${import.meta.env.BASE_URL}version.json`;
    fetch(versionPath)
      .then(res => res.json())
      .then(data => setVersion(data))
      .catch(err => {
        console.warn('Failed to fetch version info:', err);
        // Fallback version if fetch fails
        setVersion({
          version: '0.1.0',
          commitCount: 0,
          commitHash: 'unknown',
          branchName: 'unknown',
          timestamp: new Date().toISOString(),
          buildDate: 'Unknown'
        });
      });
  }, []);

  return version;
}
