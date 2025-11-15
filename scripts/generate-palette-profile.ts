import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { buildPaletteProfile } from '../src/services/palette-profile';

async function main() {
  const [htmlPath, outputPath, url, cssPath] = process.argv.slice(2);
  if (!htmlPath || !outputPath || !url) {
    console.error('Usage: tsx scripts/generate-palette-profile.ts <input.html> <output.json> <url> [css-file]');
    process.exit(1);
  }

  const html = readFileSync(resolve(htmlPath), 'utf8');
  const css = cssPath ? readFileSync(resolve(cssPath), 'utf8') : undefined;
  const profile = buildPaletteProfile({
    url,
    html,
    css,
  });

  writeFileSync(resolve(outputPath), JSON.stringify(profile, null, 2), 'utf8');
  console.log(`Palette profile written to ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
