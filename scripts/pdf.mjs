// Agents Office — uma entrega do cérebro vira PDF.
//   node scripts/pdf.mjs                          lista as entregas
//   node scripts/pdf.mjs "<nota.md>" [saida.pdf]  gera o PDF ao lado da nota
//   node scripts/pdf.mjs --self-check             testa o conversor, sem abrir o Chrome
// Usa o Chrome desta máquina pelo playwright-core, o mesmo caminho do check.mjs. Sem dependência nova.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { loadConfig, ROOT } from '../config.mjs';

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = s => esc(s)
  .replace(/\[\[([^\]]+)\]\]/g, '$1')
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');

// A nota do cérebro traz cabeçalho YAML (agent, task, skills…) e um rodapé "Read: [[nota]]".
// Os dois são registro interno do escritório e não entram no documento.
export function stripNoteChrome(md) {
  const m = String(md).replace(/\r/g, '').match(/^---\n([\s\S]*?)\n---\n/);
  const meta = {};
  let body = String(md).replace(/\r/g, '');
  if (m) {
    for (const l of m[1].split('\n')) { const k = l.match(/^([a-z]+):\s*(.*)$/i); if (k) meta[k[1]] = k[2].trim(); }
    body = body.slice(m[0].length);
  }
  body = body.replace(/\n---\s*\nRead:[^\n]*\s*$/, '\n');
  return { meta, body: body.trim() };
}

// ponytail: conversor do subconjunto que os agentes escrevem (títulos, negrito, código, listas,
// tabelas pipe, regra). Se as entregas ficarem mais ricas, troque este bloco por `marked`.
export function mdToHtml(md) {
  const out = [];
  const lines = String(md).replace(/\r/g, '').split('\n');
  let list = null; // 'ul' | 'ol'
  const closeList = () => { if (list) { out.push(`</${list}>`); list = null; } };
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const row = t => t.trim().startsWith('|') || /\|/.test(t) && t.trim().length > 0;
    // tabela: uma linha com | seguida de uma linha separadora ---|---
    if (/\|/.test(l) && /^\s*\|?[\s:-]*-[\s:|-]*$/.test(lines[i + 1] || '')) {
      closeList();
      const cells = t => t.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(c => inline(c.trim()));
      out.push('<table><thead><tr>' + cells(l).map(c => `<th>${c}</th>`).join('') + '</tr></thead><tbody>');
      i++;
      while (i + 1 < lines.length && row(lines[i + 1]) && /\|/.test(lines[i + 1])) {
        i++;
        out.push('<tr>' + cells(lines[i]).map(c => `<td>${c}</td>`).join('') + '</tr>');
      }
      out.push('</tbody></table>');
      continue;
    }
    const h = l.match(/^(#{1,4})\s+(.*)$/);
    if (h) { closeList(); out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); continue; }
    if (/^\s*(---|\*\*\*|___)\s*$/.test(l)) { closeList(); out.push('<hr>'); continue; }
    const ul = l.match(/^\s*[-*]\s+(.*)$/);
    if (ul) { if (list !== 'ul') { closeList(); out.push('<ul>'); list = 'ul'; } out.push(`<li>${inline(ul[1])}</li>`); continue; }
    const ol = l.match(/^\s*\d+\.\s+(.*)$/);
    if (ol) { if (list !== 'ol') { closeList(); out.push('<ol>'); list = 'ol'; } out.push(`<li>${inline(ol[1])}</li>`); continue; }
    if (!l.trim()) { closeList(); continue; }
    closeList();
    out.push(`<p>${inline(l)}</p>`);
  }
  closeList();
  return out.join('\n');
}

const page = (title, body, business, origem = '') => `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  @page { size: A4; margin: 22mm 18mm 20mm; }
  body { font: 10.5pt/1.55 -apple-system, "Helvetica Neue", Arial, sans-serif; color: #1a1a1a; }
  h1 { font-size: 17pt; color: #C4161C; border-bottom: 2px solid #C4161C; padding-bottom: 6px; margin: 0 0 14px; }
  h2 { font-size: 12.5pt; color: #C4161C; margin: 20px 0 6px; page-break-after: avoid; }
  h3, h4 { font-size: 11pt; margin: 14px 0 4px; page-break-after: avoid; }
  p { margin: 0 0 8px; }
  ul, ol { margin: 0 0 8px; padding-left: 20px; }
  li { margin: 0 0 3px; }
  code { background: #f2f2f2; padding: 1px 4px; border-radius: 3px; font-size: 9.5pt; }
  hr { border: 0; border-top: 1px solid #ddd; margin: 14px 0; }
  table { border-collapse: collapse; width: 100%; margin: 8px 0 14px; font-size: 9pt; page-break-inside: avoid; }
  th { background: #C4161C; color: #fff; text-align: left; }
  th, td { border: 1px solid #ccc; padding: 4px 6px; vertical-align: top; }
  tbody tr:nth-child(even) { background: #fafafa; }
  strong { color: #000; }
</style>
<body><main>${body}</main>
<p style="margin-top:18px;font-size:8pt;color:#888">${esc(business)}${origem ? ' · ' + esc(origem) : ''} · rascunho gerado pelo escritório · confira antes de enviar.</p>
</body></html>`;

const foot = business => `<div style="width:100%;font-size:7.5pt;color:#999;padding:0 18mm;display:flex;justify-content:space-between">
  <span>${esc(business)}</span><span>autodefesabrasil.com.br</span><span class="pageNumber"></span></div>`;

/* ---------- self-check: o conversor, sem Chrome ---------- */
if (process.argv[2] === '--self-check') {
  const h = mdToHtml([
    '# Proposta', 'Texto com **negrito** e `codigo`.', '',
    '| ITEM | QTS |', '|---|---|', '| Câmera | 40 |', '| Gravador | 2 |', '',
    '- um', '- dois', '', '1. passo', '## Seção', 'Fim <script>x</script>',
  ].join('\n'));
  assert.match(h, /<h1>Proposta<\/h1>/, 'título h1');
  assert.match(h, /<strong>negrito<\/strong>/, 'negrito');
  assert.match(h, /<code>codigo<\/code>/, 'código');
  assert.match(h, /<th>ITEM<\/th><th>QTS<\/th>/, 'cabeçalho da tabela');
  assert.match(h, /<td>Câmera<\/td><td>40<\/td>/, 'linha da tabela');
  assert.match(h, /<td>Gravador<\/td><td>2<\/td>/, 'segunda linha');
  assert.match(h, /<ul>\n<li>um<\/li>\n<li>dois<\/li>\n<\/ul>/, 'lista');
  assert.match(h, /<ol>\n<li>passo<\/li>\n<\/ol>/, 'lista numerada');
  assert.match(h, /<h2>Seção<\/h2>/, 'título h2');
  assert.doesNotMatch(h, /<script>/, 'HTML da nota não pode escapar');
  const n = stripNoteChrome('---\nagent: PROPOSTAS\ntask: abc123\n---\n# Proposta\ncorpo\n\n---\nRead: [[voice]] · [[icp]]\n');
  assert.strictEqual(n.meta.agent, 'PROPOSTAS', 'cabeçalho lido');
  assert.strictEqual(n.body, '# Proposta\ncorpo', 'cabeçalho e rodapé removidos do corpo');
  assert.doesNotMatch(mdToHtml(n.body), /agent:|task:|Read:/, 'registro interno não entra no PDF');
  assert.match(mdToHtml('ver [[voice]]'), /ver voice/, 'wiki-link vira texto');
  assert.ok(!/\|/.test(h.match(/<table>[\s\S]*<\/table>/)[0]), 'tabela não deixa pipes');
  console.log('✓ conversor ok — títulos, negrito, código, tabela, listas, escape');
  process.exit(0);
}

/* ---------- gerar ---------- */
const cfg = loadConfig();
const NOTES = path.join(cfg.brainPath, 'Agents Office');
const arg = process.argv[2];

if (!arg) {
  const list = fs.existsSync(NOTES) ? fs.readdirSync(NOTES).filter(f => f.endsWith('.md')) : [];
  console.log(list.length ? 'Entregas em ' + NOTES + ':\n' + list.map(f => '  ' + f).join('\n') +
    `\n\nnode scripts/pdf.mjs "${list[0]}"` : 'Nenhuma entrega ainda em ' + NOTES);
  process.exit(0);
}

const src = [arg, path.join(NOTES, arg), path.join(ROOT, arg)].find(p => fs.existsSync(p) && fs.statSync(p).isFile());
if (!src) { console.error(`✗ não achei "${arg}". Rode sem argumento para ver as entregas.`); process.exit(1); }

const { meta, body: md } = stripNoteChrome(fs.readFileSync(src, 'utf8'));
const title = (md.match(/^#\s+(.*)$/m) || [, path.basename(src, '.md')])[1].trim();
const out = path.resolve(process.argv[3] || src.replace(/\.md$/, '.pdf'));

let chromium;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = await import('playwright-core')); }
let browser;
try { browser = await chromium.launch(); } catch { browser = await chromium.launch({ channel: 'chrome' }); }
const p = await browser.newPage();
const origem = [meta.agent, meta.done ? new Date(meta.done).toLocaleString('pt-BR') : null].filter(Boolean).join(' · ');
await p.setContent(page(title, mdToHtml(md), cfg.name, origem), { waitUntil: 'load' });
await p.pdf({ path: out, format: 'A4', printBackground: true, displayHeaderFooter: true,
  headerTemplate: '<div></div>', footerTemplate: foot(cfg.name),
  margin: { top: '18mm', bottom: '16mm', left: '0', right: '0' } });
await browser.close();
console.log(`✓ ${title}\n  ${out}  (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);
