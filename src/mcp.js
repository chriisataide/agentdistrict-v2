// CONNECTORS — per-department dock of MCP brand-logo tiles (AJ's spec, 2 Aug 2026, rev 2).
// v1 was an orbit ring; AJ: "uncoordinated and hard to notice". Now each dept has ONE fixed
// "CONNECTORS" group — a tidy camera-facing row of tiles — with constant back-and-forth
// packet traffic between tiles and desks so the connectors visibly help the agents work.
// Real sim events fire a strong pulse + tile→desk beam + return ack; ambient exchanges keep
// steady energy between events. Full brand colour · LOD small-out/full-in · click = tooltip.
//
// V3.1 (7 Sep 2026): the list is REAL when served — `connectors` (src/connectors.js) carries the
// MCP servers the user's Claude Code is connected to, their status, which pods they feed, and
// the roster's tool preferences; onToolsUsed() lights the wire an agent actually pulled on.
// Opened as a file (no server) the demo list below still plays.
import * as THREE from 'three';
import { MCP_LOGOS, MCP_BY_DEPT } from './mcplogos.js';
import { applyAgentTools, profileShared } from './profile.js';
import { ptBR } from './pt-br.js';

// agent → tools they'd plausibly be driving (falls back to any connector in the dept's dock)
export const AGENT_MCP = {
  // marketing
  mlead: ['meta', 'clarity', 'notion'], ada: ['meta', 'clarity'], newt: ['beehiiv', 'loops'], gfx: ['canva'], iggy: ['canva', 'clarity'], riley: ['meta', 'beehiiv', 'clarity', 'notion'],
  vid: ['hyperframes', 'canva'],
  // emails
  elead: ['gmail', 'notion'], cmail: ['gmail'], imail: ['gmail', 'notion'], vmail: ['gmail'], kmail: ['gmail'],
  // sales
  enzo: ['fullenrich'], lexi: ['notion', 'gmail'], ilm: ['gmail', 'imessage', 'fullenrich'], pros: ['apollo', 'gmail'],
  piper: ['notion', 'gmail'], folo: ['gmail', 'imessage'],
  // operations
  olead: ['notion', 'gmail', 'pandadoc'], scout: ['notion'], legal: ['pandadoc', 'gmail'], comply: ['notion', 'gmail'], report: ['gmail', 'notion'], dash: ['notion'],
  // finance
  alead: ['xero', 'gmail'],
  invo: ['xero', 'stripe'], apay: ['xero'], recon: ['stripe', 'xero'],
  // delivery
  dlead: ['notion', 'gmail'], pco: ['notion'], qa: ['notion'], crep: ['pandadoc', 'notion'], cass: ['canva', 'notion'],
  dasst: ['canva'], ona: ['gmail', 'notion'],
};
applyAgentTools(AGENT_MCP); // INDUSTRY PROFILE (12 Sep 2026): per-industry demo file; no-op otherwise

// screen axes in world space (iso azimuth 45°): SR = screen-right, FRONT = toward camera
const SR = new THREE.Vector3(1, 0, -1).normalize();
const FRONT = new THREE.Vector3(1, 0, 1).normalize();

// per-dept dock anchor: direction * distance from pod centre, picked to dodge billboards,
// the Brain constellation and each dept's focus rail. Verified by screenshot, not theory.
// fdir/fdist/fh (optional) = a SECOND anchor used while that dept is focused, lerped in by
// focusDim — the marketing focus look (row floating in the empty gap beside the pod, labels
// under, pill above) is AJ's approved reference; support/sales re-anchor to match it.
const DOCKS = {
  marketing: { dir: SR.clone().negate(), dist: 12.5, h: 8.0 },  // screen-left of pod — the approved reference look
  emails:    { dir: SR.clone(),          dist: 12.5, h: 8.0,    // overview: screen-right of pod (was support's slot)
               fdir: SR.clone().negate(), fdist: 12.5 },        // focus: mirror marketing (rail LEFT, empty gap left of pod)
  delivery:  { dir: SR.clone().negate(), dist: 12.5, h: 8.0 },  // rail LEFT like marketing → dock in the gap beside the pod
  sales:     { dir: FRONT.clone(),       dist: 17.5, h: 8.0,    // overview: front row below the pod (old right-edge stack clipped off-screen)
               fdir: SR.clone().negate(), fdist: 13.5 },        // focus: marketing-style row in the open floor (rail is RIGHT)
  fin:       { dir: FRONT.clone(), dist: 20.5, h: 8.0 },        // front-bottom past the corner; camera-facing
                                                                // (20.5 not 17.5 — the pod lost 2 rows in the ops/finance split)
  ops:       { dir: SR.clone().negate(), dist: 13.5, h: 8.0,    // bottom-left pod: dock in the open floor to its screen-left
               fdir: SR.clone().negate(), fdist: 13.5 },
};

function smooth(a, b, x) { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

export function initMcp({ scene, hud, LAYOUT, DEPTS, FR, R, connectors = null }) {
  const LIVE = !!(connectors && connectors.live);
  const BY_DEPT = LIVE ? connectors.byDept : MCP_BY_DEPT;
  const LOGOS = LIVE ? { ...MCP_LOGOS, ...connectors.logos } : MCP_LOGOS;
  const AGENT_TOOLS = (LIVE && connectors.agentTools) || AGENT_MCP;
  const STATUS = (LIVE && connectors.status) || {};
  const NAMES = (LIVE && connectors.names) || {};

  const loader = new THREE.TextureLoader();
  const items = [];          // every connector tile
  const byDeptKey = {};      // `${dept}:${key}` -> item
  const byDept = {};         // dept -> items
  const sprites = [];        // raycast targets
  const beams = [];          // travelling data packets
  const dotTex = {};         // per-colour packet textures
  const docks = {};          // dept -> runtime (label el, seats, ambient timer)
  const v3 = new THREE.Vector3();

  function glowTexture(hex) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 6, 64, 64, 62);
    g.addColorStop(0, hex + 'ff'); g.addColorStop(0.45, hex + '88'); g.addColorStop(1, hex + '00');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  function dotTexture(hex) {
    if (!dotTex[hex]) {
      const c = document.createElement('canvas'); c.width = c.height = 64;
      const x = c.getContext('2d');
      x.beginPath(); x.arc(32, 32, 18, 0, 7); x.fillStyle = hex; x.fill();
      x.lineWidth = 4; x.strokeStyle = 'rgba(21,20,20,0.55)'; x.stroke();
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
      dotTex[hex] = t;
    }
    return dotTex[hex];
  }

  for (const [dept, keys] of Object.entries(BY_DEPT)) {
    const L = LAYOUT[dept];
    const D = DOCKS[dept];
    const glowT = glowTexture(DEPTS[dept].chip);
    const anchor = new THREE.Vector3(
      L.pos[0] + D.dir.x * D.dist, D.h, L.pos[1] + D.dir.z * D.dist);
    byDept[dept] = [];
    keys.forEach((key, i) => {
      const def = LOGOS[key];
      const tex = loader.load(def.img);
      tex.colorSpace = THREE.SRGBColorSpace;
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowT, transparent: true, opacity: 0, depthTest: false }));
      glow.renderOrder = 48;
      scene.add(glow);
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
      s.renderOrder = 50;
      s.userData.dept = dept;       // joins the focus-dim pass
      s.userData.mcpKey = key;
      scene.add(s);
      sprites.push(s);

      const label = document.createElement('div');
      label.className = 'mcpl';
      label.textContent = def.name.toUpperCase();
      hud.appendChild(label);

      const item = {
        dept, key, name: def.name, sprite: s, glow, label,
        anchor, i, n: keys.length,
        bobPhase: i * 0.9 + Math.random() * 0.4,
        pulseT0: -1e9, pulseAmp: 0.3,
        lastActive: performance.now() - Math.random() * 9000,
      };
      items.push(item);
      byDept[dept].push(item);
      byDeptKey[dept + ':' + key] = item;
    });

    // the group label — this is what names the dock "CONNECTORS" at every zoom
    const conn = document.createElement('div');
    conn.className = 'connl';
    conn.innerHTML = `<span class="dot" style="background:${DEPTS[dept].chip}"></span>CONNECTORS`;
    hud.appendChild(conn);
    docks[dept] = {
      anchor, conn,
      seats: Object.values(R).filter(r => r.a.dept === dept).map(r => r.seat),
      nextAmbient: performance.now() + 600 + Math.random() * 1400,
    };
  }

  // ── top-bar connector strip — the overview face of the connectors ──
  // The top bar holds the connector logos. Their branches remain visible all the
  // way to the pods; hovering a logo emphasises the routes it feeds.
  // SHARED connectors (gmail: five depts; notion: every dept, V3.1) sit at the far RIGHT end
  // of the strip and each runs its OWN loom (below) instead of joining any dept's cluster/fan
  const SHARED = LIVE ? connectors.shared : (profileShared() || { notion: '#151414', gmail: '#EA4335' });
  const uniqKeys = [...new Set(Object.values(BY_DEPT).flat())].filter(k => !SHARED[k]);
  for (const k of ((LIVE && connectors.off) || [])) if (!uniqKeys.includes(k)) uniqKeys.push(k); // present but unusable: shown grey, never wired
  for (const k of Object.keys(SHARED)) uniqKeys.push(k);
  const topconn = document.getElementById('topconn');
  const topImgs = {};
  if (topconn) {
    topconn.innerHTML = `<span class="tc-lab"><span class="dot"></span>CONNECTORS</span>`;
    const tip = document.createElement('div');
    tip.className = 'tc-tip';
    tip.hidden = true;
    document.body.appendChild(tip);
    const statusText = {
      connected: ptBR ? 'Conectado' : 'Connected',
      'needs-auth': ptBR ? 'Precisa de autenticação' : 'Needs authentication',
      failed: ptBR ? 'Falha na conexão' : 'Connection failed',
      pending: ptBR ? 'Aguardando conexão' : 'Connecting',
      denied: ptBR ? 'Bloqueado para os agentes' : 'Blocked for agents',
    };
    const hideTip = () => { tip.hidden = true; };
    const showTip = (img, k) => {
      const name = LOGOS[k].name;
      const state = statusText[STATUS[k] || 'connected'] || STATUS[k];
      tip.replaceChildren();
      const strong = document.createElement('strong');
      strong.textContent = name;
      const small = document.createElement('span');
      small.textContent = state;
      tip.append(strong, small);
      tip.hidden = false;
      const rect = img.getBoundingClientRect();
      tip.style.left = Math.max(8, Math.min(innerWidth - tip.offsetWidth - 8, rect.left + rect.width / 2 - tip.offsetWidth / 2)) + 'px';
      tip.style.top = rect.bottom + 9 + 'px';
    };
    topconn.addEventListener('scroll', hideTip, { passive: true });
    uniqKeys.forEach((k, i) => {
      const img = document.createElement('img');
      img.src = LOGOS[k].img;
      img.alt = LOGOS[k].name;
      const state = statusText[STATUS[k] || 'connected'] || STATUS[k];
      img.title = `${LOGOS[k].name} — ${state}`;
      if (STATUS[k] && STATUS[k] !== 'connected') { // real list: a server that is there but not usable
        img.classList.add('off', 'st-' + STATUS[k]);
      }
      img.tabIndex = 0;
      img.setAttribute('role', 'button');
      img.setAttribute('aria-label', `${LOGOS[k].name}: ${state}`);
      img.style.setProperty('--d', (0.15 + i * 0.09) + 's'); // staggered pop-in on load
      img.addEventListener('animationend', (e) => { if (e.animationName === 'tcin') img.classList.add('in'); });
      img.addEventListener('click', () => fireConnector(k)); // presenter cue: click a logo → its dept(s) light up
      img.addEventListener('mouseenter', () => { hoveredConnector = k; showTip(img, k); });
      img.addEventListener('mouseleave', () => { if (hoveredConnector === k) hoveredConnector = null; hideTip(); });
      img.addEventListener('focus', () => { hoveredConnector = k; showTip(img, k); });
      img.addEventListener('blur', () => { if (hoveredConnector === k) hoveredConnector = null; hideTip(); });
      img.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fireConnector(k); }
      });
      topconn.appendChild(img);
      topImgs[k] = img;
    });
    if (LIVE && !uniqKeys.length) { // honest empty state — nothing is wired until the user connects something
      const none = document.createElement('span');
      none.className = 'tc-none';
      none.textContent = 'nothing yet — connect in claude.ai or run: claude mcp add';
      topconn.appendChild(none);
    }
  }

  // cam + dockAcur are set every tick. When the docks are hidden, packet traffic
  // follows the visible network; no packets fly freely across the overview.
  // volleyAt schedules the boot/replay flourish: a pulse from every connector into its dept(s).
  let cam = null, dockAcur = 0;
  let volleyAt = performance.now() + uniqKeys.length * 90 + 900;

  // A branching connector network: individual logos feed department junctions,
  // then the coloured trunks and shared-tool routes reach sockets on each pod.
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.id = 'wires';
  hud.insertBefore(svg, hud.firstChild); // under every HUD overlay, above the 3D canvas
  // Keep sockets along the clear outer side of each pod, away from the desk columns.
  const SOCKET_SIDE = { marketing: 1, emails: 1, sales: -1, ops: -1, fin: -1, delivery: 1 };
  const sharedByDept = Object.fromEntries(Object.keys(BY_DEPT).map(dept => [
    dept, Object.keys(SHARED).filter(key => BY_DEPT[dept].includes(key)),
  ]));
  const hasOwnRoute = dept => BY_DEPT[dept].some(key => !SHARED[key]);
  const socketCount = dept => sharedByDept[dept].length + Number(hasOwnRoute(dept));
  const socket = (L, side, index, count) => {
    const t = count > 1 ? index / (count - 1) : 0.5;
    return [
      L.pos[0] + side * (L.w / 2 - 0.9),
      0.18,
      L.pos[1] + (t - 0.5) * (L.d - 6),
    ];
  };
  const wires = {}, wirePulses = [];
  let hoveredConnector = null, selectedConnector = null, selectedUntil = 0;
  Object.keys(BY_DEPT).forEach((dept, ji) => {
    const L = LAYOUT[dept], side = SOCKET_SIDE[dept];
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', DEPTS[dept].chip);
    path.setAttribute('stroke-width', '1.6');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-dasharray', '3 8');
    svg.appendChild(path);
    // branch fan: a thin drop from EACH of this dept's logos, converging at a junction
    // node under the bar — makes "which tools feed this dept" readable at a glance
    const branch = document.createElementNS(svgNS, 'path');
    branch.setAttribute('fill', 'none');
    branch.setAttribute('stroke', DEPTS[dept].chip);
    branch.setAttribute('stroke-width', '1.3');
    branch.setAttribute('stroke-linecap', 'round');
    branch.setAttribute('stroke-dasharray', '2 5');
    svg.appendChild(branch);
    const jdot = document.createElementNS(svgNS, 'circle'); // junction node
    jdot.setAttribute('r', '1.9');
    jdot.setAttribute('fill', DEPTS[dept].chip);
    svg.appendChild(jdot);
    const dot = document.createElementNS(svgNS, 'circle'); // the pod-side socket
    dot.setAttribute('r', '2.6');
    dot.setAttribute('fill', DEPTS[dept].chip);
    svg.appendChild(dot);
    const port = socket(L, side, 0, socketCount(dept));
    wires[dept] = { path, branch, jdot, dot, offset: 0, ji,
      port, fport: port };
  });
  // SHARED wiring (gmail per AJ 3 Aug rev 2; notion joins 5 Sep): NOT part of any dept fan/loom —
  // from its far-right logo each shared connector drops to its own junction, then runs one fully
  // INDEPENDENT trunk-style conduit per using dept, entering the pod at its own socket a few
  // units along the edge from the dept's port (cables plugged in side by side, never merged).
  // Traffic keyed to a shared connector pulses on ITS wire, not the dept trunk.
  const shared = {};
  Object.keys(SHARED).forEach((key, si) => {
    const ink = SHARED[key];
    const drop = document.createElementNS(svgNS, 'path'); // logo → junction
    drop.setAttribute('fill', 'none');
    drop.setAttribute('stroke', ink);
    drop.setAttribute('stroke-width', '1.3');
    drop.setAttribute('stroke-linecap', 'round');
    drop.setAttribute('stroke-dasharray', '2 5');
    svg.appendChild(drop);
    const jdot = document.createElementNS(svgNS, 'circle');
    jdot.setAttribute('r', '1.9');
    jdot.setAttribute('fill', ink);
    svg.appendChild(jdot);
    const wiresOf = {};
    Object.keys(BY_DEPT).filter(d => BY_DEPT[d].includes(key)).forEach(dept => {
      const L = LAYOUT[dept], side = SOCKET_SIDE[dept];
      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', ink);
      path.setAttribute('stroke-width', '1.4');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-dasharray', '3 8');
      svg.appendChild(path);
      const dot = document.createElementNS(svgNS, 'circle'); // its own socket at the pod
      dot.setAttribute('r', '2.3');
      dot.setAttribute('fill', ink);
      svg.appendChild(dot);
      // number only this pod's connections, spaced along its clear side edge
      const index = Number(hasOwnRoute(dept)) + sharedByDept[dept].indexOf(key);
      const count = socketCount(dept);
      const port = socket(L, side, index, count);
      wiresOf[dept] = { path, dot, port, fport: port };
    });
    shared[key] = { ink, drop, jdot, wires: wiresOf, offset: 0, jy: 92 + si * 10 };
  });

  // ── the model layer: Claude and the owner's authenticated Codex CLI ──
  // The model logos also keep visible routes into the Brain.
  const MODELS = { claude: '#D97757', codex: '#151414' };
  const topmodels = document.getElementById('topmodels');
  const modelImgs = {};
  if (topmodels) {
    topmodels.innerHTML = `<span class="tc-lab"><span class="dot"></span>RUNS HEADLESS ON</span>`;
    Object.keys(MODELS).forEach((k, i) => {
      const img = document.createElement('img');
      img.src = k === 'codex' ? LOGOS.chatgpt.img : LOGOS[k].img;
      img.alt = img.title = k === 'codex' ? 'Codex · OpenAI' : 'Claude';
      img.style.setProperty('--d', (0.9 + i * 0.12) + 's');
      img.tabIndex = 0;
      img.setAttribute('role', 'button');
      img.addEventListener('animationend', (e) => { if (e.animationName === 'tcin') img.classList.add('in'); });
      img.addEventListener('click', () => modelPulse(k, true));
      img.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); modelPulse(k, true); }
      });
      topmodels.appendChild(img);
      modelImgs[k] = img;
    });
  }
  const mwires = {};
  Object.keys(MODELS).forEach((k, i) => {
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', MODELS[k]);
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-dasharray', '3 8');
    svg.appendChild(path);
    const dot = document.createElementNS(svgNS, 'circle');
    dot.setAttribute('r', '2.6');
    dot.setAttribute('fill', MODELS[k]);
    svg.appendChild(dot);
    mwires[k] = { path, dot, offset: 0,
      port: [LAYOUT.brain.pos[0] + 4 - i * 4, 0.18, LAYOUT.brain.pos[1] - LAYOUT.brain.d / 2 + 2.4] };
  });
  let nextModelPulse = performance.now() + 2600;
  function setProviders(providers) {
    for (const k of Object.keys(MODELS)) {
      const img = modelImgs[k];
      if (!img) continue;
      const state = providers?.[k];
      img.classList.toggle('off', !state?.connected);
      img.title = k === 'codex'
        ? state?.connected ? `Codex · OpenAI — ${state.auth === 'chatgpt' ? 'conectado com ChatGPT' : 'conectado com chave de API'}` : 'Codex · OpenAI — desconectado; execute codex login'
        : state?.connected ? 'Claude — conectado' : 'Claude — desconectado';
    }
  }
  // The usage gauge belongs to Claude. Codex has its own authenticated model tile.
  let usageEl = null;
  function setUsage(u) {
    if (!topmodels) return;
    if (!usageEl) { usageEl = document.createElement('span'); usageEl.className = 'tm-usage'; topmodels.appendChild(usageEl); }
    const when = ts => ts ? new Date(ts).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' }) : '—';
    const bar = (lab, x) => { if (!x) return ''; const cls = x.percent >= 90 ? 'c' : x.percent >= 75 ? 'w' : ''; return `<span>${lab}</span><span class="ub"><i class="${cls}" style="width:${x.percent}%"></i></span><b>${x.percent >= 100 ? 'LIMIT' : x.percent + '%'}</b>`; };
    if (u && u.ok && u.source === 'claude') {
      usageEl.className = 'tm-usage';
      usageEl.innerHTML = bar('SESSION', u.session) + (u.session && u.week ? '<span class="sep">·</span>' : '') + bar('WEEK', u.week);
      usageEl.title = `Your Claude plan, as Claude Code shows it. Session resets ${when(u.session && u.session.resetsAt)} · week resets ${when(u.week && u.week.resetsAt)}.`;
    } else if (u && u.ok && u.source === 'office') {
      const w = u.window || {}; const n = w.tokens || 0; const tok = n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'K' : String(n);
      usageEl.className = 'tm-usage off';
      usageEl.innerHTML = `<span>THIS WINDOW</span><b>${tok}</b><span>TOKENS</span><span class="sep">·</span><b>${w.runs || 0}</b><span>RUNS</span>` + (w.resetsAt ? `<span class="sep">·</span><span>RESETS</span><b>${new Date(w.resetsAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</b>` : '');
      usageEl.title = `Claude's usage gauge is unavailable (${u.reason || 'no answer'}). This is the office's own count for the current five-hour window.`;
    } else { usageEl.className = 'tm-usage off'; usageEl.innerHTML = '<span>USAGE UNAVAILABLE</span>'; usageEl.title = (u && u.reason) || ''; }
  }
  function modelPulse(k, strong = false) {
    if (!modelImgs[k] || modelImgs[k].classList.contains('off')) return;
    wirePulse('brain', { model: k, scale: strong ? 1.2 : 0.9 });
    wirePulse('brain', { model: k, reverse: true, delay: 900, scale: strong ? 1 : 0.75 });
    if (modelImgs[k] && strong) { modelImgs[k].classList.remove('tpulse'); void modelImgs[k].offsetWidth; modelImgs[k].classList.add('tpulse'); }
  }

  // subtle by design (rev 2, AJ: pulses still read as attacks): small, dim, slow glides
  function wirePulse(dept, { reverse = false, delay = 0, scale = 1, shared: sk = null, model = null } = {}) {
    const el = document.createElementNS(svgNS, 'circle');
    el.setAttribute('r', 2.2 * scale);
    el.setAttribute('fill', model ? MODELS[model] : sk ? SHARED[sk] : DEPTS[dept].chip);
    el.setAttribute('opacity', '0');
    svg.appendChild(el);
    wirePulses.push({ dept, el, reverse, shared: sk, model, t0: performance.now() + delay, dur: 1400 });
  }
  let stripDept = undefined;
  function tickWires(now, dt, wireA, focused) {
    // Inside a department the header strip shows only its connectors.
    const f = (focused && focused !== 'brain') ? focused : null;
    if (topconn) {
      if (f) {
        topconn.style.opacity = 1; topconn.style.visibility = 'visible';
        if (stripDept !== f) { // centre the strip and name the department it feeds
          for (const [k, img] of Object.entries(topImgs)) img.style.display = BY_DEPT[f].includes(k) ? '' : 'none';
          topconn.classList.add('focus');
          topconn.querySelector('.tc-lab').innerHTML =
            `<span class="dot" style="background:${DEPTS[f].chip}"></span>${DEPTS[f].short} · CONNECTED TO`;
        }
      } else {
        topconn.style.opacity = wireA;
        topconn.style.visibility = wireA < 0.02 ? 'hidden' : 'visible';
        if (stripDept !== null) {
          for (const img of Object.values(topImgs)) img.style.display = '';
          topconn.classList.remove('focus');
          topconn.querySelector('.tc-lab').innerHTML = `<span class="dot"></span>CONNECTORS`;
        }
      }
      stripDept = f;
    }
    if (topmodels) {
      topmodels.style.opacity = f ? 1 : wireA;
      topmodels.style.visibility = (!f && wireA < 0.02) ? 'hidden' : 'visible';
    }
    if (wireA < 0.02) { svg.style.display = 'none'; return; }
    svg.style.display = 'block';
    const activeKey = hoveredConnector || (now < selectedUntil ? selectedConnector : null);
    const hideWire = (w) => { w.path.setAttribute('d', ''); w.branch && w.branch.setAttribute('d', ''); w.jdot && w.jdot.setAttribute('opacity', 0); w.dot.setAttribute('opacity', 0); };
    for (const [dept, w] of Object.entries(wires)) {
      if (f && dept !== f) { hideWire(w); continue; } // focus: only this department's loom
      // branch fan: one drop per logo → junction under the cluster; trunk: junction → port.
      // junction depths are staggered per dept so neighbouring fans don't overlap.
      // gmail is EXCLUDED from every fan — it feeds the junctions via its own loom below
      const xs = BY_DEPT[dept].filter(k => !SHARED[k]).map(k => {
        const r = topImgs[k].getBoundingClientRect();
        return (r.left + r.right) / 2;
      });
      if (!xs.length) { // a dept fed only by shared connectors (EMAILS) has no trunk of its own
        w.path.setAttribute('d', ''); w.branch.setAttribute('d', '');
        w.jdot.setAttribute('opacity', 0); w.dot.setAttribute('opacity', 0);
        continue;
      }
      const jx = xs.reduce((a, b) => a + b, 0) / xs.length;
      const jy = f ? 100 : 96 + w.ji * 7, sy = 52;
      w.branch.setAttribute('d', xs.map(x =>
        `M ${x} ${sy} C ${x} ${sy + (jy - sy) * 0.5}, ${jx} ${jy - (jy - sy) * 0.4}, ${jx} ${jy}`).join(' '));
      const pt = f ? w.fport : w.port;
      v3.set(pt[0], pt[1], pt[2]).project(cam);
      const ex = (v3.x * 0.5 + 0.5) * innerWidth, ey = (-v3.y * 0.5 + 0.5) * innerHeight;
      const bend = Math.min(150, Math.max(36, (ey - jy) * 0.32));
      w.path.setAttribute('d', `M ${jx} ${jy} C ${jx} ${jy + bend}, ${ex} ${ey - bend}, ${ex} ${ey}`);
      const highlighted = activeKey && !SHARED[activeKey] && BY_DEPT[dept].includes(activeKey);
      w.offset -= dt * (f ? 13 : 6); // slow crawl toward the pod (slower still at rest)
      w.path.setAttribute('stroke-dashoffset', w.offset);
      w.path.setAttribute('stroke-opacity', (f ? 0.72 : highlighted ? 0.68 : 0.32) * wireA);
      w.path.setAttribute('stroke-width', f ? 2 : highlighted ? 1.9 : 1.4);
      w.branch.setAttribute('stroke-dashoffset', w.offset);
      w.branch.setAttribute('stroke-opacity', (f ? 0.7 : highlighted ? 0.62 : 0.27) * wireA);
      w.branch.setAttribute('stroke-width', f ? 1.6 : 1.1);
      w.jdot.setAttribute('cx', jx); w.jdot.setAttribute('cy', jy);
      w.jdot.setAttribute('opacity', (f ? 0.8 : highlighted ? 0.75 : 0.42) * wireA);
      w.dot.setAttribute('cx', ex); w.dot.setAttribute('cy', ey);
      w.dot.setAttribute('opacity', (f ? 0.85 : highlighted ? 0.8 : 0.62) * wireA);
    }
    // shared wiring: each shared logo drops to its own junction, then an INDEPENDENT
    // trunk-style conduit per using dept, ending at that connector's own socket on the pod
    for (const [key, sh] of Object.entries(shared)) {
      if (!topImgs[key]) continue;
      const gr = topImgs[key].getBoundingClientRect();
      const gx = (gr.left + gr.right) / 2, gsy = 52, gjy = sh.jy;
      sh.drop.setAttribute('d', `M ${gx} ${gsy} L ${gx} ${gjy}`);
      sh.offset -= dt * (f ? 13 : 6);
      sh.drop.setAttribute('stroke-dashoffset', sh.offset);
      sh.drop.setAttribute('stroke-opacity', (f ? 0.62 : activeKey === key ? 0.65 : 0.3) * wireA);
      sh.jdot.setAttribute('cx', gx); sh.jdot.setAttribute('cy', gjy);
      sh.jdot.setAttribute('opacity', (f ? 0.75 : activeKey === key ? 0.72 : 0.4) * wireA);
      for (const [dept, g] of Object.entries(sh.wires)) {
        if (f && dept !== f) { hideWire(g); continue; }
        const gp = f ? g.fport : g.port;
        v3.set(gp[0], gp[1], gp[2]).project(cam);
        const ex = (v3.x * 0.5 + 0.5) * innerWidth, ey = (-v3.y * 0.5 + 0.5) * innerHeight;
        const bend = Math.min(150, Math.max(36, (ey - gjy) * 0.32));
        g.path.setAttribute('d', `M ${gx} ${gjy} C ${gx} ${gjy + bend}, ${ex} ${ey - bend}, ${ex} ${ey}`);
        g.path.setAttribute('stroke-dashoffset', sh.offset);
        g.path.setAttribute('stroke-opacity', (f ? 0.68 : activeKey === key ? 0.66 : 0.23) * wireA);
        g.path.setAttribute('stroke-width', f ? 1.9 : activeKey === key ? 1.7 : 1.15);
        g.dot.setAttribute('cx', ex); g.dot.setAttribute('cy', ey);
        g.dot.setAttribute('opacity', (f ? 0.85 : activeKey === key ? 0.8 : 0.62) * wireA);
      }
    }
    // model wiring: Claude + Codex logos → the Brain's back edge; they pulse on their own
    for (const [k, m] of Object.entries(mwires)) {
      if (!modelImgs[k] || modelImgs[k].classList.contains('off')) { hideWire(m); continue; }
      const r = modelImgs[k].getBoundingClientRect();
      const mx = (r.left + r.right) / 2, msy = 52;
      v3.set(m.port[0], m.port[1], m.port[2]).project(cam);
      const ex = (v3.x * 0.5 + 0.5) * innerWidth, ey = (-v3.y * 0.5 + 0.5) * innerHeight;
      const bend = Math.min(140, Math.max(36, (ey - msy) * 0.33));
      m.path.setAttribute('d', `M ${mx} ${msy} C ${mx} ${msy + bend}, ${ex} ${ey - bend}, ${ex} ${ey}`);
      m.offset = (m.offset || 0) - dt * (f ? 13 : 6);
      m.path.setAttribute('stroke-dashoffset', m.offset);
      m.path.setAttribute('stroke-opacity', (f ? 0.44 : 0.24) * wireA);
      m.dot.setAttribute('cx', ex); m.dot.setAttribute('cy', ey);
      m.dot.setAttribute('opacity', (f ? 0.8 : 0.58) * wireA);
    }
    if (now > nextModelPulse) {
      modelPulse(Math.random() < 0.6 ? 'claude' : 'codex');
      nextModelPulse = now + 2400 + Math.random() * 3200;
    }
    for (let i = wirePulses.length - 1; i >= 0; i--) {
      const p = wirePulses[i];
      const k = (now - p.t0) / p.dur;
      if (k < 0) continue;
      if (k >= 1) { p.el.remove(); wirePulses.splice(i, 1); continue; }
      const path = p.model ? mwires[p.model]?.path
        : (p.shared && shared[p.shared]?.wires[p.dept]) ? shared[p.shared].wires[p.dept].path : wires[p.dept]?.path;
      if (!path?.getAttribute('d')) { p.el.remove(); wirePulses.splice(i, 1); continue; } // wire hidden (other dept in focus)
      const e = k * k * (3 - 2 * k);
      const pt = path.getPointAtLength((p.reverse ? 1 - e : e) * path.getTotalLength());
      p.el.setAttribute('cx', pt.x); p.el.setAttribute('cy', pt.y);
      p.el.setAttribute('opacity', (k < 0.15 ? k / 0.15 : k > 0.8 ? (1 - k) / 0.2 : 1) * 0.55 * wireA);
    }
  }

  function fireConnector(key) {
    const now = performance.now();
    selectedConnector = key;
    selectedUntil = now + 2200;
    for (const [dept, keys] of Object.entries(BY_DEPT)) {
      if (!keys.includes(key)) continue;
      const item = byDeptKey[dept + ':' + key];
      const seats = docks[dept].seats;
      if (!item || !seats.length) continue;
      pulse(item, now, 0.3);
      const seat = seats[Math.floor(Math.random() * seats.length)];
      spawnBeam(item, seat, now, { count: 3 });                                        // tool → desk
      spawnBeam(item, seat, now, { reverse: true, count: 2, delay: 650, scale: 0.8 }); // desk → tool ack
    }
  }

  // C hotkey / CC.connectorReveal(): re-pop the top-bar logos, then the beam volley
  function startReveal(now) {
    for (const img of Object.values(topImgs)) {
      img.classList.remove('in', 'tpulse');
      img.style.animation = 'none'; void img.offsetWidth; img.style.animation = '';
    }
    volleyAt = now + uniqKeys.length * 90 + 600;
  }

  function pulse(item, now, amp = 0.3) {
    item.pulseT0 = now;
    item.pulseAmp = amp;
    item.lastActive = now;
    // docks hidden (overview) → the top-bar logo carries the activity pulse instead
    if (dockAcur < 0.5) {
      const img = topImgs[item.key];
      if (img && img.classList.contains('in')) {
        img.classList.remove('tpulse'); void img.offsetWidth; img.classList.add('tpulse');
      }
    }
  }

  // packet train along an arc. reverse=true sends desk → tile (the "ack"/request direction)
  // ephemeral connection line under an exchange — packets riding a visible wire read as
  // data transfer; the same dots free-flying read as projectiles ("attacking the pods", AJ)
  const streams = new Map(); // key -> {line, mat, dept, t0, until}
  function ensureStream(from, mid, to, dept, now, until) {
    const key = [from.x, from.z, to.x, to.z].map(v => v.toFixed(1)).join(':');
    const s = streams.get(key);
    if (s) { s.until = Math.max(s.until, until); return; }
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      pts.push(from.clone().lerp(mid, t).lerp(mid.clone().lerp(to, t), t));
    }
    const mat = new THREE.LineBasicMaterial({
      color: DEPTS[dept].chip, transparent: true, opacity: 0, depthTest: false });
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat);
    line.renderOrder = 45; // under the tiles (50) and packets (60)
    line.userData.dept = dept;
    scene.add(line);
    streams.set(key, { line, mat, dept, t0: now, until });
  }
  function tickStreams(now, focused, focusDim) {
    for (const [key, s] of streams) {
      const fadeIn = Math.min(1, (now - s.t0) / 250);
      const fadeOut = now > s.until ? Math.max(0, 1 - (now - s.until) / 350) : 1;
      const dimmed = focused && focused !== 'brain' && s.dept !== focused;
      s.mat.opacity = 0.34 * fadeIn * fadeOut * (dimmed ? 1 - 0.85 * focusDim : 1);
      if (fadeOut === 0) {
        scene.remove(s.line); s.line.geometry.dispose(); s.mat.dispose();
        streams.delete(key);
      }
    }
  }

  function spawnBeam(item, seatPos, now, { reverse = false, count = 4, delay = 0, scale = 1 } = {}) {
    if (!cam) return;
    // overview: docks are hidden, so the exchange rides the dept's permanent wire instead
    // of free-flying packets — one pulse dot per train, direction preserved
    if (dockAcur < 0.5) { wirePulse(item.dept, { reverse, delay, scale, shared: SHARED[item.key] ? item.key : null }); return; }
    const tile = item.sprite.position.clone();
    const desk = seatPos.clone(); desk.y += 3.1;
    const from = reverse ? desk : tile, to = reverse ? tile : desk;
    const mid = from.clone().lerp(to, 0.5); mid.y = Math.max(from.y, to.y) + 2.4;
    const hex = DEPTS[item.dept].chip;
    ensureStream(from, mid, to, item.dept, now, now + delay + count * 105 + 720);
    for (let i = 0; i < count; i++) {
      const d = new THREE.Sprite(new THREE.SpriteMaterial({
        map: dotTexture(hex), transparent: true, depthTest: false, opacity: 0 }));
      d.renderOrder = 60;
      d.scale.set(0.9 * scale, 0.9 * scale, 1);
      scene.add(d);
      beams.push({ s: d, from, mid, to, t0: now + delay + i * 105, dur: 720 });
    }
  }

  function tickBeams(now) {
    for (let i = beams.length - 1; i >= 0; i--) {
      const b = beams[i];
      const k = (now - b.t0) / b.dur;
      if (k < 0) { b.s.material.opacity = 0; continue; }
      if (k >= 1) { scene.remove(b.s); b.s.material.dispose(); beams.splice(i, 1); continue; }
      const e = k * k * (3 - 2 * k); // eased glide along the wire, not constant missile speed
      const a1 = v3.copy(b.from).lerp(b.mid, e);
      const a2 = b.mid.clone().lerp(b.to, e);
      b.s.position.copy(a1.lerp(a2, e));
      b.s.material.opacity = k < 0.12 ? k / 0.12 : k > 0.8 ? (1 - k) / 0.2 : 1;
    }
  }

  // an agent did real work → their connector lights up, ships a packet train to the desk,
  // and the desk answers with a return train — visible request/response
  function onAgentEvent(agentId, dept, seatPos, now) {
    const prefs = (AGENT_TOOLS[agentId] || []).filter(k => byDeptKey[dept + ':' + k]);
    const dock = BY_DEPT[dept] || [];
    if (!dock.length) return;
    const key = prefs.length ? prefs[Math.floor(Math.random() * prefs.length)]
                             : dock[Math.floor(Math.random() * dock.length)];
    const item = byDeptKey[dept + ':' + key];
    if (!item) return;
    pulse(item, now, 0.3);
    spawnBeam(item, seatPos, now);                                   // tile → desk
    spawnBeam(item, seatPos, now, { reverse: true, count: 3, delay: 850, scale: 0.85 }); // desk → tile ack
  }

  // LIVE: an agent really called these tools → their logos pulse and the exchange rides the
  // wire into that agent's pod (keys as the server gives them: logo key, server id, or 'web')
  function onToolsUsed(agentId, keys) {
    const r = R[agentId]; if (!r || !Array.isArray(keys)) return;
    keys.forEach((key, i) => setTimeout(() => {
      const t = performance.now();
      if (key === 'web') { modelPulse('claude', true); return; }
      const item = byDeptKey[r.a.dept + ':' + key] || items.find(it => it.key === key);
      if (!item) return;
      pulse(item, t, 0.3);
      if (item.dept === r.a.dept) {
        spawnBeam(item, r.seat, t, { count: 3 });
        spawnBeam(item, r.seat, t, { reverse: true, count: 2, delay: 650, scale: 0.8 });
      } else wirePulse(item.dept, { shared: SHARED[key] ? key : null });
      if (byDeptKey[r.a.dept + ':' + key] === undefined && SHARED[key]) wirePulse(r.a.dept, { shared: key });
    }, i * 420));
  }

  // click tooltip
  const tip = document.createElement('div');
  tip.className = 'mcp-tip';
  document.body.appendChild(tip);
  let tipHideAt = 0;
  function showTip(sprite, x, y, now) {
    if (!sprite.visible) return; // docks hidden at overview — raycast still hits invisible sprites
    const item = items.find(it => it.sprite === sprite);
    if (!item) return;
    pulse(item, now, 0.3);
    const idle = Math.max(0, Math.round((now - item.lastActive) / 1000));
    tip.innerHTML = `<b>${item.name}</b> MCP<br><span class="t-live">● ${STATUS[item.key] || 'connected'}</span> · ` +
      `${DEPTS[item.dept].short.toLowerCase()} · ${idle < 2 ? 'active now' : 'active ' + idle + 's ago'}`;
    tip.style.left = Math.min(x + 14, innerWidth - 190) + 'px';
    tip.style.top = (y - 10) + 'px';
    tip.classList.add('on');
    tipHideAt = now + 2600;
  }

  function tick(now, dt, view, camera, focused, focusDim) {
    const z = view.zoom;
    const pxPerWorld = z * innerHeight / (2 * FR);
    // pixel-targeted sizing: ~32px tiles at overview, ~80px zoomed in — holds at any viewport
    const targetPx = 32 + 48 * smooth(1.15, 3.2, z);
    const base = targetPx / pxPerWorld;
    const gap = base * 1.16;                    // row spacing scales with tile size
    const labelA = smooth(2.0, 2.5, z);
    const pillScale = 0.68 + 0.32 * smooth(1.2, 2.4, z);
    cam = camera;
    // V3.5 (AJ, 6 Sep): the in-world tile docks are RETIRED — the top-bar strip is the
    // connectors at every zoom (centred + wired to the pod in focus). dockA pinned to 0 keeps
    // the sprites/labels/pills hidden and routes all traffic onto the wires.
    const dockA = 0;
    dockAcur = dockA;

    // boot/replay flourish: ONE gentle pulse per department, well spaced — a per-connector
    // volley (17 exchanges at once) read as a barrage
    if (volleyAt && now > volleyAt) {
      const go = !focused;
      volleyAt = 0;
      if (go) Object.keys(BY_DEPT).forEach((dept, i) => setTimeout(() => {
        const its = byDept[dept], seats = docks[dept].seats;
        if (!its.length || !seats.length) return;
        const item = its[Math.floor(Math.random() * its.length)];
        pulse(item, performance.now(), 0.3);
        spawnBeam(item, seats[Math.floor(Math.random() * seats.length)], performance.now(), { scale: 0.9 });
      }, 350 + i * 420));
    }

    // current dock anchor per dept: overview anchor, lerped to the focus anchor (if any)
    // by focusDim while that dept is focused
    const anchorOf = (dept, out) => {
      const D = DOCKS[dept], L = LAYOUT[dept];
      const k = (focused === dept && D.fdir) ? focusDim : 0;
      const fd = D.fdir || D.dir, fdist = D.fdist ?? D.dist, fh = D.fh ?? D.h;
      return out.set(
        L.pos[0] + D.dir.x * D.dist * (1 - k) + fd.x * fdist * k,
        D.h * (1 - k) + fh * k,
        L.pos[1] + D.dir.z * D.dist * (1 - k) + fd.z * fdist * k);
    };

    for (const it of items) {
      const off = (it.i - (it.n - 1) / 2) * gap;
      // coordinated group breath: whole row bobs gently, tiles slightly phase-offset
      const bob = 0.22 * Math.sin(now / 750 + it.bobPhase);
      anchorOf(it.dept, it.sprite.position);
      it.sprite.position.x += SR.x * off;
      it.sprite.position.y += bob;
      it.sprite.position.z += SR.z * off;

      it.sprite.visible = it.glow.visible = dockA > 0.02;
      it.sprite.material.opacity = dockA;
      const pk = (now - it.pulseT0) / 600;
      const pop = pk >= 0 && pk < 1 ? 1 + it.pulseAmp * Math.sin(Math.min(pk, 1) * Math.PI) : 1;
      it.sprite.scale.set(base * pop, base * pop, 1);
      it.glow.position.copy(it.sprite.position);
      it.glow.scale.set(base * 2.1 * pop, base * 2.1 * pop, 1);
      it.glow.material.opacity = (pk >= 0 && pk < 1 ? 0.85 * Math.sin(pk * Math.PI) * it.pulseAmp / 0.3 : 0) * dockA;

      // per-tile name label, zoomed-in only
      const dimmed = focused && focused !== 'brain' && it.dept !== focused;
      const a = labelA * dockA * (dimmed ? 1 - 0.85 * focusDim : 1);
      if (a < 0.02) { it.label.style.display = 'none'; }
      else {
        it.label.style.display = 'block';
        v3.copy(it.sprite.position).project(camera);
        const sx = (v3.x * 0.5 + 0.5) * innerWidth;
        const sy = (-v3.y * 0.5 + 0.5) * innerHeight + base * pxPerWorld * 0.5 + 5;
        it.label.style.transform = `translate(${sx}px,${sy}px) translate(-50%,0)`;
        it.label.style.opacity = a;
      }
    }

    // CONNECTORS group labels + ambient back-and-forth traffic per dock
    for (const [dept, dk] of Object.entries(docks)) {
      const n = byDept[dept].length;
      anchorOf(dept, v3);
      v3.y += 0.6 + base * 0.62; // pill floats above the row centre
      v3.project(camera);
      const sx = (v3.x * 0.5 + 0.5) * innerWidth;
      const sy = (-v3.y * 0.5 + 0.5) * innerHeight;
      const dimmed = focused && focused !== 'brain' && dept !== focused;
      dk.conn.style.transform = `translate(${sx}px,${sy}px) translate(-50%,-100%) scale(${pillScale})`;
      dk.conn.style.opacity = (dimmed ? 1 - 0.85 * focusDim : 1) * dockA;

      // steady exchange: a random connector and a random desk trade packets both ways —
      // the constant "connectors helping the agents" energy AJ asked for
      if (now > dk.nextAmbient && dk.seats.length) {
        const item = byDept[dept][Math.floor(Math.random() * n)];
        const seat = dk.seats[Math.floor(Math.random() * dk.seats.length)];
        const outFirst = Math.random() < 0.5;
        pulse(item, now, 0.18);
        spawnBeam(item, seat, now, { reverse: !outFirst, count: 3, scale: 0.8 });
        spawnBeam(item, seat, now, { reverse: outFirst, count: 2, delay: 700, scale: 0.7 });
        // overview wires want calm — sparse pulses; zoomed-in docks keep the busy exchange
        dk.nextAmbient = now + (1300 + Math.random() * 1900) * (focused && focused !== 'brain' ? 1.5 : 2.8);
      }
    }
    tickBeams(now);
    tickStreams(now, focused, focusDim);
    tickWires(now, dt, 1 - dockA, focused);
    if (tipHideAt && now > tipHideAt) { tip.classList.remove('on'); tipHideAt = 0; }
  }

  // dark mode: the ink-coloured looms (Notion, Codex) would vanish on a dark ground
  const inkBlack = new Set(Object.keys(SHARED).filter(k => SHARED[k] === '#151414'));
  function setDark(on) {
    const ink = on ? '#E8E6DF' : '#151414';
    MODELS.codex = ink;
    for (const k of inkBlack) {
      SHARED[k] = ink;
      const sh = shared[k];
      if (sh) {
        sh.drop.setAttribute('stroke', ink);
        sh.jdot.setAttribute('fill', ink);
        for (const g of Object.values(sh.wires)) { g.path.setAttribute('stroke', ink); g.dot.setAttribute('fill', ink); }
      }
    }
    if (mwires.codex) { mwires.codex.path.setAttribute('stroke', ink); mwires.codex.dot.setAttribute('fill', ink); }
  }
  return { tick, sprites: [], onAgentEvent, onToolsUsed, showTip, startReveal, setDark, setUsage, setProviders, live: LIVE, keys: uniqKeys }; // sprites: none clickable — docks retired
}
