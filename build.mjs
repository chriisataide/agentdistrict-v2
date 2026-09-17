// Bundle src/main.js (+three) into a single self-contained HTML that opens by double-click.
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { buildBrainGraph } from './graph-build.mjs';
await buildBrainGraph(); // V3.6: bake the vault's wiki-link graph into src/braingraph.js

const res = await build({
  entryPoints: ['src/main.js'],
  bundle: true,
  format: 'iife',
  minify: true,
  write: false,
  target: 'es2020',
});
const js = res.outputFiles[0].text;
const shell = readFileSync('src/shell.html', 'utf8');
const brandImage = `data:image/png;base64,${readFileSync('assets/img/AgentDistrict.png').toString('base64')}`;
const faviconImage = `data:image/png;base64,${readFileSync('assets/img/favicon.png').toString('base64')}`;
const brainImage = `data:image/png;base64,${readFileSync('assets/img/cerebro.png').toString('base64')}`;
const page = shell.replace('__BRAND_IMAGE__', brandImage).replace('__FAVICON_IMAGE__', faviconImage).replace('__BRAIN_IMAGE__', brainImage);
const html = page.replace('<!--APP-->', () => `<script>${js}</script>`);
mkdirSync('dist', { recursive: true });
writeFileSync('dist/command-centre-v2.html', html);

// dev variant with external script for faster iteration
mkdirSync('dist', { recursive: true });
writeFileSync('dist/app.js', js);
writeFileSync('dist/dev.html', page.replace('<!--APP-->', '<script src="app.js"></script>'));
console.log(`built dist/command-centre-v2.html (${(html.length / 1024).toFixed(0)} KB)`);
