// Illustrated centre pod and the vault's wiki-link graph. The pod shows the supplied transparent
// brain image; the full graph, note content and relationships live in the overlay. Agent reads
// briefly glint on the illustration, while writes add notes to the graph and task-panel strip.
import * as THREE from 'three';
import { ptBR } from './pt-br.js';
import { BRAIN as BRAIN0 } from './braingraph.js';
import { PROFILE } from './profile.js';
const BRAIN = (PROFILE && PROFILE.graph && PROFILE.graph.nodes && PROFILE.graph.nodes.length) ? PROFILE.graph : BRAIN0; // INDUSTRY PROFILE: the demo company's own graph
import { AGENTS } from './data.js';

const GROUP_COL = {
  '40-Marketing': '#E69393', '50-Products': '#98A5EF', '60-Sales': '#EADC8F', '70-Delivery': '#8FD3F4',
  '10-Business': '#BFA2E3', '00-Meta': '#F2B33D', '90-Skills': '#5ADEB7', '30-Customers': '#D1DECD',
  '95-Agents': '#B0ADA3', '80-Finance': '#A9B6F0', '05-Inbox': '#B0ADA3',
  '20-Brand': '#D9BEA1', 'Agents Office': '#78D4B2',
};
const GROUP_PT = { Meta: 'Metadados', Business: 'Negócio', Brand: 'Marca', Customers: 'Clientes', Products: 'Produtos', Sales: 'Vendas', Delivery: 'Entregas', Finance: 'Finanças', Operations: 'Operações', Skills: 'Habilidades', Agents: 'Agentes', Inbox: 'Caixa de entrada', Marketing: 'Marketing', Emails: 'E-mails', 'Agents Office': 'Agent District' };
const GROUP_NAME = g => { const name = g.replace(/^\d\d-/, ''); return ptBR ? GROUP_PT[name] || name : name; };
// which folders each department reads from (and writes into)
const DEPT_FOLDERS = {
  marketing: ['40-Marketing', '20-Brand'], sales: ['60-Sales', '50-Products', '30-Customers'],
  emails: ['60-Sales', '30-Customers', '10-Business'], ops: ['10-Business', '00-Meta', '95-Agents', '90-Skills'],
  fin: ['80-Finance', '10-Business'], delivery: ['70-Delivery', '50-Products'],
};
let INK = '21,20,20'; // dark mode swaps this for the cream ink (setTheme)
const GREEN = '#1E9070';
const slug = t => String(t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 42);
const timeStr = ts => new Date(ts).toLocaleTimeString(ptBR ? 'pt-BR' : 'en-NZ', { hour: 'numeric', minute: '2-digit', hour12: !ptBR }).toLowerCase();
const agentOf = id => AGENTS.find(a => a.id === id);

export function initBrain({ scene, brainGroup, getR, esc, hud, toScreen, getCamera }) {
  /* ---------- data ---------- */
  let nodes = BRAIN.nodes.map((n, i) => ({ ...n, i }));
  let links = BRAIN.links.map(([a, b]) => [a, b]);
  let adj = nodes.map(() => new Set());
  for (const [a, b] of links) { adj[a].add(b); adj[b].add(a); }
  let byId = new Map(nodes.map(n => [n.id, n.i]));
  const state = { notes: BRAIN.notes, lastRead: null, newToday: 0, reads: new Map(), written: new Map() };
  let hubs = nodes.slice(0, 8);
  const folderNodes = f => nodes.filter(n => n.g === f && n.d >= 2);
  function pickFor(dept) {
    const pool = (DEPT_FOLDERS[dept] || []).flatMap(folderNodes);
    const cands = pool.length ? pool : nodes.slice(0, 40);
    // weight by link count so hubs are read more often, like a real vault
    const tot = cands.reduce((s, n) => s + Math.sqrt(n.d), 0);
    let x = Math.random() * tot;
    for (const n of cands) { x -= Math.sqrt(n.d); if (x <= 0) return n; }
    return cands[0];
  }

  /* ---------- illustrated Brain on the centre pod ----------
     The supplied transparent PNG is embedded by build.mjs, so both the server and standalone
     HTML show the same image. The full note graph remains available in the overlay. */
  // Keep the artwork inside the 16 × 16 plinth and bring its visual centre toward the front half.
  const BW = 13.4, BH = BW * 1215 / 1295;
  const CENTRE = new THREE.Vector3(3.5, BH / 2 + 0.2, 3.5);
  let floorPos = new Map(BRAIN.floor.map(([x, y], i) => [i, { x, y }]));
  const onFloor = n => floorPos.has(n.i);
  const FP = n => floorPos.get(n.i);
  const artUrl = document.getElementById('brainArtSource')?.src;
  let figure = null;
  if (artUrl) {
    const art = new THREE.TextureLoader().load(artUrl);
    art.colorSpace = THREE.SRGBColorSpace;
    art.anisotropy = 8;
    figure = new THREE.Sprite(new THREE.SpriteMaterial({ map: art, transparent: true, depthWrite: false, depthTest: false }));
    figure.scale.set(BW, BH, 1);
    figure.position.copy(CENTRE);
    figure.renderOrder = 65;
    figure.userData.dept = 'brain';
    brainGroup.add(figure);
  }
  const _r = new THREE.Vector3(), _u = new THREE.Vector3();
  const W = n => { // glints stay within the illustrated brain, not on the transparent garden edge
    const f = FP(n) || { x: n.x, y: n.y }; const cam = getCamera();
    _r.setFromMatrixColumn(cam.matrixWorld, 0).normalize(); _u.setFromMatrixColumn(cam.matrixWorld, 1).normalize();
    return CENTRE.clone().addScaledVector(_r, f.x * BW * .2).addScaledVector(_u, -f.y * BH * .18);
  };
  const pulses = [];
  let nextPulse = performance.now() + 2500;

  /* ---------- reads: a glint on the note + a dashed line to the desk ---------- */
  const glintTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 4, 64, 64, 60); g.addColorStop(0, 'rgba(30,144,112,1)'); g.addColorStop(0.35, 'rgba(30,144,112,.55)'); g.addColorStop(1, 'rgba(30,144,112,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const fx = []; // { sprite, line, born }
  const labels = []; // read pills
  // the mock's glint: a soft green disc that swells and fades on the note for 2 s
  function flatPulse(n) {
    const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: glintTex, transparent: true, opacity: 0, depthTest: false }));
    m.position.copy(W(n)); m.renderOrder = 71;
    scene.add(m);
    pulses.push({ m, born: performance.now() });
  }
  function glint(n, seat, label) {
    flatPulse(n);
    const p = W(n);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glintTex, transparent: true, depthTest: false }));
    s.position.copy(p); s.scale.set(0.9, 0.9, 1); s.renderOrder = 70;
    scene.add(s);
    if (label && hud && toScreen) { // "CLIENT EMAILS READ MOC-DELIVERY" — the mock's little pill
      const el = document.createElement('div'); el.className = 'readlab'; el.textContent = label; hud.appendChild(el);
      labels.push({ el, at: p.clone(), born: performance.now() });
    }
    let line = null;
    if (seat) {
      const geo = new THREE.BufferGeometry().setFromPoints([p.clone(), new THREE.Vector3(seat.x, 2.4, seat.z)]);
      line = new THREE.Line(geo, new THREE.LineDashedMaterial({ color: 0x1E9070, dashSize: 0.9, gapSize: 0.6, transparent: true, opacity: 0.85, depthTest: false }));
      line.computeLineDistances(); line.renderOrder = 69;
      scene.add(line);
    }
    fx.push({ sprite: s, line, born: performance.now() });
  }
  let quiet = false; // V3.5 (AJ: "the alerts on the Brain are distracting"): a live office shows only REAL reads and writes — no theatre glints, no ambient pulse
  function setQuiet(on) { quiet = !!on; }
  function read(agentId) {
    const a = agentOf(agentId); if (!a) return;
    const n = pickFor(a.dept);
    const r = getR()[agentId];
    if (!quiet) glint(n, r && r.seat, `${a.name} read ${n.id}`);
    state.lastRead = { note: n.id, agent: a.name, ts: Date.now() };
    state.reads.set(n.id, { agent: a.name, ts: Date.now() });
    updateStrip();
  }
  // writes: a finished task becomes a new note off its department's hub
  function write(agentId, title) {
    const a = agentOf(agentId); if (!a) return;
    const folder = (DEPT_FOLDERS[a.dept] || ['00-Meta'])[0];
    const hubPool = folderNodes(folder).slice(0, 5); const hub = hubPool.length ? hubPool[Math.floor(Math.random() * hubPool.length)] : hubs[0];
    const id = slug(title) || 'note';
    if (byId.has(id)) { glint(nodes[byId.get(id)]); return; }
    const ang = Math.random() * Math.PI * 2, dist = 0.10 + Math.random() * 0.06;
    const n = { id, g: folder, d: 1, x: Math.max(-0.95, Math.min(0.95, hub.x + Math.cos(ang) * dist)), y: Math.max(-0.95, Math.min(0.95, hub.y + Math.sin(ang) * dist)), i: nodes.length, fresh: true };
    const hf = FP(hub) || { x: hub.x, y: hub.y };
    floorPos.set(n.i, { x: Math.max(-0.98, Math.min(0.98, hf.x + Math.cos(ang) * 0.09)), y: Math.max(-0.98, Math.min(0.98, hf.y + Math.sin(ang) * 0.09)) });
    nodes.push(n); byId.set(id, n.i); adj.push(new Set([hub.i])); adj[hub.i].add(n.i); links.push([hub.i, n.i]); hub.d++;
    state.notes++; state.newToday++;
    state.written.set(id, { agent: a.name, task: title, ts: Date.now() });
    glint(n);
    updateStrip();
  }
  // LIVE: replace the graph with the server's (the user's real vault), keeping today's state
  function setGraph(g) {
    if (!g || !g.nodes || !g.nodes.length) return;
    const today = new Date().toISOString().slice(0, 10);
    nodes = g.nodes.map((n, i) => ({ ...n, i, fresh: n.g === 'Agents Office' && n.id.startsWith(today) })); // notes the office wrote today glow green
    links = g.links.map(([a, b]) => [a, b]);
    adj = nodes.map(() => new Set()); for (const [a, b] of links) { adj[a].add(b); adj[b].add(a); }
    byId = new Map(nodes.map(n => [n.id, n.i])); hubs = nodes.slice(0, 8);
    floorPos = new Map((g.floor || []).map(([x, y], i) => [i, { x, y }]));
    state.notes = g.notes; state.newToday = nodes.filter(n => n.fresh).length; sel = null;
    groups = [...new Set(nodes.map(n => n.g))].sort(); on.clear(); groups.forEach(g => on.add(g));
    if (openNow) { chips(); showIntro(); updateMeta(); }
    updateStrip();
  }
  // LIVE: an agent read a named note (the server tells us which) — glint it if it is on the floor
  function readNote(agentId, name) {
    const a = agentOf(agentId); const i = byId.get(name);
    if (!a) return;
    if (i != null && onFloor(nodes[i])) { const r = getR()[agentId]; glint(nodes[i], r && r.seat, `${a.name} read ${name}`); }
    state.lastRead = { note: name, agent: a.name, ts: Date.now() }; state.reads.set(name, { agent: a.name, ts: Date.now() });
    updateStrip();
  }
  function tick(now) {
    if (now > nextPulse && !quiet) { flatPulse(nodes[0]); nextPulse = now + 6000; } // the mock's 6-second glint on the biggest hub (demo only)
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i], k = (now - p.born) / 2000;
      if (k >= 1) { scene.remove(p.m); p.m.material.dispose(); pulses.splice(i, 1); continue; }
      const a = Math.sin(k * Math.PI);
      p.m.material.opacity = 0.55 * a; const r = (0.5 + 0.75 * k) * BW / 130 * 4; p.m.scale.set(r, r, 1);
    }
    for (let i = labels.length - 1; i >= 0; i--) {
      const l = labels[i], k = (now - l.born) / 2600;
      if (k >= 1) { l.el.remove(); labels.splice(i, 1); continue; }
      const [sx, sy] = toScreen(l.at);
      l.el.style.transform = `translate(${sx}px,${sy - 18}px) translate(-50%,-100%)`;
      l.el.style.opacity = k < 0.1 ? k / 0.1 : k > 0.8 ? (1 - k) / 0.2 : 1;
    }
    for (let i = fx.length - 1; i >= 0; i--) {
      const f = fx[i], k = (now - f.born) / 2000;
      if (k >= 1) { scene.remove(f.sprite); if (f.line) scene.remove(f.line); fx.splice(i, 1); continue; }
      const a = k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85;
      f.sprite.material.opacity = a; const sc = 1.2 + k * 1.6; f.sprite.scale.set(sc, sc, 1);
      if (f.line) f.line.material.opacity = 0.85 * a;
    }
  }

  /* ---------- the panel strip: the door ---------- */
  const strip = document.getElementById('tpBrain');
  const micro = strip && strip.querySelector('canvas');
  if (micro) {
    const r = 3, w = 160, h = 100; micro.width = w * r; micro.height = h * r;
    const x = micro.getContext('2d'); x.scale(r, r);
    const Q = n => [w / 2 + n.x * 44, h / 2 + n.y * 44];
    x.lineWidth = .6; x.strokeStyle = `rgba(${INK},.22)`;
    for (const [a, b] of links) { const [x1, y1] = Q(nodes[a]), [x2, y2] = Q(nodes[b]); x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); x.stroke(); }
    for (const n of nodes) { const [px, py] = Q(n); x.fillStyle = GROUP_COL[n.g] || '#B0ADA3'; x.beginPath(); x.arc(px, py, .8 + Math.sqrt(n.d) * .32, 0, 7); x.fill(); }
    strip.addEventListener('click', open);
  }
  function updateStrip() {
    if (!strip) return;
    strip.querySelector('.tb-count').textContent = state.notes.toLocaleString(ptBR ? 'pt-BR' : 'en-NZ');
    const lr = strip.querySelector('.tb-last');
    lr.innerHTML = state.lastRead ? `${ptBR ? 'Última leitura' : 'Last read'} <b>${esc(state.lastRead.note)}</b> ${ptBR ? 'por' : 'by'} ${esc(state.lastRead.agent)} · ${timeStr(state.lastRead.ts)}` : `${links.length} ${ptBR ? 'ligações entre notas · nenhuma leitura ainda' : 'wiki links · nothing read yet'}`;
    strip.querySelector('.tb-new').textContent = state.newToday ? `+${state.newToday} ${ptBR ? 'nota(s) hoje' : `note${state.newToday > 1 ? 's' : ''} today`}` : '';
  }
  updateStrip();

  /* ---------- the full-screen graph (G / click the pod / the strip) ---------- */
  const ov = document.getElementById('brainOv');
  const bcv = document.getElementById('bvCv'); const bctx = bcv.getContext('2d');
  const search = document.getElementById('bvSearch'); const chipsEl = document.getElementById('bvChips');
  const pane = document.getElementById('bvPane'); const meta = document.getElementById('bvMeta');
  let openNow = false, k = 1.2, tx = 0, ty = 0, hover = null, sel = null, drag = null, match = null, freshOnly = false;
  let groups = [...new Set(nodes.map(n => n.g))].sort();
  const on = new Set(groups);
  function chips() {
    chipsEl.innerHTML = groups.map((g, i) => `<button type="button" class="bv-chip${on.has(g) ? ' on' : ''}" data-g="${i}" aria-pressed="${on.has(g)}"><i style="background:${GROUP_COL[g] || '#B0ADA3'}"></i>${esc(GROUP_NAME(g))}</button>`).join('') +
      `<button type="button" class="bv-chip live${freshOnly ? ' on' : ''}" data-g="__fresh" aria-pressed="${freshOnly}">${ptBR ? 'Novas hoje' : 'New today'} · ${state.newToday}</button>`;
  }
  chipsEl.addEventListener('click', e => {
    const b = e.target.closest('.bv-chip'); if (!b) return;
    if (b.dataset.g === '__fresh') freshOnly = !freshOnly; else { const group = groups[+b.dataset.g]; if (!group) return; on.has(group) ? on.delete(group) : on.add(group); }
    chips(); if (!sel) showIntro();
  });
  search.addEventListener('input', () => { const q = search.value.trim().toLowerCase(); match = q ? new Set(nodes.filter(n => n.id.toLowerCase().includes(q)).map(n => n.i)) : null; if (!sel) showIntro(); });
  search.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') { search.value = ''; match = null; search.blur(); } });
  const visible = n => on.has(n.g) && (!freshOnly || n.fresh);
  function graphCx() { return bcv.clientWidth * (bcv.clientWidth < 850 ? .5 : .36); }
  function graphCy() { return bcv.clientHeight * (bcv.clientWidth < 850 ? .39 : .56); }
  function S() { return Math.min(bcv.clientWidth * (bcv.clientWidth < 850 ? .65 : .52), bcv.clientHeight * (bcv.clientWidth < 850 ? .32 : .7)) * k; }
  function sx(n) { return graphCx() + n.x * S() + tx; }
  function sy(n) { return graphCy() + n.y * S() + ty; }
  bcv.addEventListener('mousemove', e => {
    if (drag) { tx += e.clientX - drag.x; ty += e.clientY - drag.y; drag = { x: e.clientX, y: e.clientY }; drag.moved = true; return; }
    let best = null, bd = 18;
    for (const n of nodes) { if (!visible(n)) continue; const d = Math.hypot(sx(n) - e.clientX, sy(n) - e.clientY); if (d < bd) { bd = d; best = n; } }
    hover = best; bcv.style.cursor = best ? 'pointer' : 'grab';
  });
  bcv.addEventListener('mousedown', e => { drag = { x: e.clientX, y: e.clientY, moved: false }; });
  addEventListener('mouseup', e => { if (!drag) return; const moved = drag.moved; drag = null; if (!moved && hover && openNow) select(hover); });
  bcv.addEventListener('wheel', e => {
    e.preventDefault(); e.stopPropagation();
    const f = Math.exp(-e.deltaY * 0.0025); const nk = Math.max(0.5, Math.min(7, k * f)); const r = nk / k;
    const cx = graphCx(), cy = graphCy();
    tx = (tx + cx - e.clientX) * r + e.clientX - cx; ty = (ty + cy - e.clientY) * r + e.clientY - cy; k = nk;
  }, { passive: false });
  const noteTitle = id => id.replace(/^(\d{4}-\d\d-\d\d) /, '$1 · ').replace(/[-_]/g, ' ');
  function updateMeta() { meta.textContent = `${owner} · ${state.notes.toLocaleString(ptBR ? 'pt-BR' : 'en-NZ')} ${ptBR ? 'NOTAS' : 'NOTES'} · ${links.length} ${ptBR ? 'LIGAÇÕES' : 'LINKS'}`; }
  function showIntro() {
    const results = nodes.filter(n => visible(n) && (!match || match.has(n.i))).sort((a, b) => b.d - a.d);
    pane.innerHTML = `<div class="bv-kicker">${ptBR ? 'BASE DE CONHECIMENTO' : 'KNOWLEDGE BASE'}</div><h3>${ptBR ? 'As notas do escritório' : 'Office notes'}</h3>` +
      `<p class="bv-lead">${ptBR ? 'Cada ponto é uma nota em Markdown. As linhas mostram referências entre elas. Os agentes consultam essas informações para trabalhar e registram resultados como novas notas.' : 'Each point is a Markdown note. Lines show references between them. Agents read this knowledge and save results as new notes.'}</p>` +
      `<div class="bv-explain"><span><i class="bv-dot"></i>${ptBR ? 'Ponto: nota' : 'Dot: note'}</span><span><i class="bv-line"></i>${ptBR ? 'Linha: ligação' : 'Line: link'}</span></div>` +
      `<div class="bv-lab">${match ? `${results.length} ${ptBR ? 'RESULTADOS' : 'RESULTS'}` : ptBR ? 'NOTAS MAIS CONECTADAS' : 'MOST CONNECTED NOTES'}</div>` +
      (results.length ? results.slice(0, 8).map(n => `<button type="button" class="bv-result" data-i="${n.i}"><i style="background:${GROUP_COL[n.g] || '#B0ADA3'}"></i><span>${esc(noteTitle(n.id))}<small>${esc(GROUP_NAME(n.g))} · ${n.d} ${ptBR ? 'ligações' : 'links'}</small></span><b>↗</b></button>`).join('') : `<p>${ptBR ? 'Nenhuma nota encontrada neste filtro.' : 'No notes in this filter.'}</p>`) +
      `<p class="bv-note">${ptBR ? 'O mapa mostra as notas que têm ligações. Notas isoladas entram na contagem, mas não aparecem como pontos.' : 'The map shows linked notes. Unlinked notes count toward the total but do not appear as dots.'}</p>`;
  }
  function showMarkdown(el, source) {
    const lines = source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').trim().split(/\r?\n/);
    el.replaceChildren();
    let paragraph = [];
    const flush = () => { if (!paragraph.length) return; const p = document.createElement('p'); p.textContent = paragraph.join(' ').replace(/\*\*/g, '').replace(/`/g, ''); el.append(p); paragraph = []; };
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) { flush(); continue; }
      const heading = trimmed.match(/^#{1,6}\s+(.+)$/);
      if (heading) { flush(); const h = document.createElement('h4'); h.textContent = heading[1]; el.append(h); continue; }
      const list = trimmed.match(/^(?:[-*]|\d+\.)\s+(.+)$/);
      if (list) { flush(); const p = document.createElement('p'); p.className = 'bv-list'; p.textContent = '• ' + list[1].replace(/\*\*/g, ''); el.append(p); continue; }
      paragraph.push(trimmed);
    }
    flush();
    if (!el.childNodes.length) el.textContent = ptBR ? 'Esta nota está vazia.' : 'This note is empty.';
  }
  async function select(n) {
    sel = n;
    const out = [...adj[n.i]].map(i => nodes[i]).sort((a, b) => b.d - a.d);
    const rd = state.reads.get(n.id), wr = state.written.get(n.id);
    pane.innerHTML = `<button type="button" class="bv-back" data-action="intro">← ${ptBR ? 'Todas as notas' : 'All notes'}</button>` +
      `<div class="bv-kicker">${ptBR ? 'NOTA' : 'NOTE'} · ${esc(GROUP_NAME(n.g))}</div><h3>${esc(noteTitle(n.id))}</h3>` +
      `<div class="bv-path"><i style="background:${GROUP_COL[n.g] || '#B0ADA3'}"></i>${n.d} ${ptBR ? 'ligações' : 'links'}${n.fresh ? ` · <span class="bv-g">${ptBR ? 'nova hoje' : 'new today'}</span>` : ''}</div>` +
      (wr ? `<p class="bv-note">${ptBR ? 'Escrita por' : 'Written by'} ${esc(wr.agent)} · ${timeStr(wr.ts)}</p>` : '') +
      (rd ? `<p class="bv-note">${ptBR ? 'Lida por' : 'Read by'} ${esc(rd.agent)} · ${timeStr(rd.ts)}</p>` : '') +
      `<div class="bv-lab">${ptBR ? 'CONTEÚDO' : 'CONTENT'}</div><div class="bv-content" id="bvContent">${ptBR ? 'Carregando nota…' : 'Loading note…'}</div>` +
      `<div class="bv-lab">${ptBR ? 'NOTAS RELACIONADAS' : 'RELATED NOTES'} · ${out.length}</div>` +
      (out.length ? out.map(o => `<button type="button" class="bv-lk" data-i="${o.i}">${esc(noteTitle(o.id))}</button>`).join('') : `<p>${ptBR ? 'Sem ligações.' : 'No links.'}</p>`);
    pane.scrollTop = 0;
    try {
      const res = await fetch(`/api/brain/note?id=${encodeURIComponent(n.id)}`);
      if (!res.ok) throw new Error('not found');
      const data = await res.json();
      if (sel !== n) return;
      const content = pane.querySelector('#bvContent');
      if (content) showMarkdown(content, data.content);
    } catch {
      if (sel !== n) return;
      const content = pane.querySelector('#bvContent');
      if (content) content.textContent = ptBR ? 'Conteúdo indisponível nesta visualização. Abra o escritório conectado ao servidor para ler a nota.' : 'Content unavailable here. Open the office through the server to read this note.';
    }
  }
  pane.addEventListener('click', e => {
    const back = e.target.closest('[data-action="intro"]');
    if (back) { sel = null; showIntro(); return; }
    const button = e.target.closest('[data-i]');
    if (!button) return;
    const n = nodes[+button.dataset.i]; if (n) { select(n); centre(n); }
  });
  function centre(n) { tx = -n.x * S(); ty = -n.y * S(); }
  function draw() {
    if (!openNow) return;
    const dpr = devicePixelRatio || 1, Wd = bcv.clientWidth, Hd = bcv.clientHeight;
    if (bcv.width !== Math.round(Wd * dpr) || bcv.height !== Math.round(Hd * dpr)) { bcv.width = Math.round(Wd * dpr); bcv.height = Math.round(Hd * dpr); }
    bctx.setTransform(dpr, 0, 0, dpr, 0, 0); bctx.clearRect(0, 0, Wd, Hd);
    const focus = hover || sel; const hi = focus ? new Set([focus.i, ...adj[focus.i]]) : null;
    bctx.lineWidth = Math.max(.8, 1.2 * Math.sqrt(k));
    for (const [a, b] of links) {
      const A = nodes[a], B = nodes[b]; if (!visible(A) || !visible(B)) continue;
      const lit = hi && hi.has(a) && hi.has(b);
      bctx.strokeStyle = lit ? 'rgba(138,216,187,.82)' : `rgba(232,230,223,${hi || match ? .055 : .20})`;
      bctx.beginPath(); bctx.moveTo(sx(A), sy(A)); bctx.lineTo(sx(B), sy(B)); bctx.stroke();
    }
    bctx.font = `600 ${Math.max(11, 11 * Math.sqrt(k))}px Inter, -apple-system, sans-serif`; bctx.textBaseline = 'middle';
    for (const n of nodes) {
      if (!visible(n)) continue;
      const x = sx(n), y = sy(n); const r = (3 + Math.sqrt(n.d) * 1.1) * Math.sqrt(k);
      const dim = (hi && !hi.has(n.i)) || (match && !match.has(n.i));
      bctx.globalAlpha = dim ? .2 : 1;
      if (!dim && (n.d >= 6 || sel === n || hover === n)) { bctx.fillStyle = 'rgba(255,255,255,.055)'; bctx.beginPath(); bctx.arc(x, y, r + 8, 0, 7); bctx.fill(); }
      bctx.fillStyle = GROUP_COL[n.g] || '#B0ADA3'; bctx.beginPath(); bctx.arc(x, y, r, 0, 7); bctx.fill();
      if (n.fresh) { bctx.strokeStyle = GREEN; bctx.lineWidth = 1.5; bctx.beginPath(); bctx.arc(x, y, r + 3, 0, 7); bctx.stroke(); }
      if (sel === n) { bctx.strokeStyle = '#E8E6DF'; bctx.lineWidth = 1.5; bctx.beginPath(); bctx.arc(x, y, r + 4, 0, 7); bctx.stroke(); }
      const label = n.d >= 8 || k > 1.9 || (hi && hi.has(n.i)) || (match && match.has(n.i)) || n.fresh;
      if (label && !dim) { bctx.fillStyle = '#E8E6DF'; bctx.fillText(noteTitle(n.id), x + r + 8, y); }
      bctx.globalAlpha = 1;
    }
    requestAnimationFrame(draw);
  }
  let owner = PROFILE && PROFILE.company ? String(PROFILE.company).toUpperCase() : 'YOUR NOTES'; // V3.1: the business name when served (was hard-coded to one company); INDUSTRY PROFILE: the demo company
  function setOwner(name) { owner = String(name || (ptBR ? 'SUAS NOTAS' : 'YOUR NOTES')).toUpperCase(); if (openNow) updateMeta(); }
  function open() {
    if (openNow) return;
    openNow = true; ov.classList.add('on'); document.body.classList.add('brainOpen');
    updateMeta(); chips(); if (!sel) showIntro();
    requestAnimationFrame(draw);
  }
  function close() { if (!openNow) return; openNow = false; ov.classList.remove('on'); document.body.classList.remove('brainOpen'); }
  function toggle() { openNow ? close() : open(); }
  document.getElementById('bvClose').addEventListener('click', close);
  document.getElementById('bvReset').addEventListener('click', () => { k = 1.2; tx = 0; ty = 0; sel = null; showIntro(); });

  function setTheme(dark) { INK = dark ? '236,234,227' : '21,20,20'; }
  return { read, readNote, write, setGraph, setTheme, setOwner, setQuiet, tick, open, close, toggle, artSprite: figure, isOpen: () => openNow, state, get nodes() { return nodes; }, get links() { return links; } };
}
