// Run text work through the owner's existing Codex CLI login. The isolated, read-only
// workspace keeps an office task from editing the app or inheriting project tools.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { normEffort } from './src/models.js';

const binary = () => process.env.AO_CODEX_BIN || 'codex';
const cwd = path.join(os.tmpdir(), 'agent-district-codex');
let statusCache = null;

export function codexStatus({ refresh = false } = {}) {
  if (!refresh && statusCache && Date.now() - statusCache.at < 30000) return statusCache.value;
  const p = spawnSync(binary(), ['login', 'status'], { encoding: 'utf8', timeout: 7000 });
  const answer = `${p.stdout || ''}\n${p.stderr || ''}`.trim();
  const connected = p.status === 0 && /logged in/i.test(answer);
  const value = { connected, auth: connected ? /chatgpt/i.test(answer) ? 'chatgpt' : 'api-key' : null };
  statusCache = { at: Date.now(), value };
  return value;
}

export function codexArgs(effort) {
  const args = ['exec', '--ephemeral', '--json', '--sandbox', 'read-only', '--skip-git-repo-check', '--ignore-user-config', '-C', cwd];
  const level = normEffort(effort);
  if (level) args.push('-c', `model_reasoning_effort="${level}"`);
  args.push('-');
  return args;
}

export function codexEvent(event) {
  if (event?.type === 'item.completed' && event.item?.type === 'agent_message') return { text: event.item.text || '' };
  if (event?.type === 'turn.completed') return { done: true, usage: event.usage || null };
  if (event?.type === 'turn.failed') return { error: event.error?.message || 'Falha na execução do Codex' };
  if (event?.type === 'error') return { error: event.message || 'Erro do Codex' };
  return {};
}

export async function runCodex({ system, user, effort, timeout = 300000 }) {
  if (!codexStatus().connected) throw new Error('Codex não está conectado. Execute codex login neste computador.');
  fs.mkdirSync(cwd, { recursive: true });
  const prompt = `PAPEL E CONTEXTO DO AGENTE\n${system}\n\nSOLICITAÇÃO\n${user}\n\nVocê está em um ambiente somente de leitura. Não afirme ter enviado, publicado, pago ou alterado algo fora desta resposta. Se a tarefa exigir uma ação externa, entregue o conteúdo pronto e diga qual ação ainda precisa ser executada.`;
  return new Promise((resolve, reject) => {
    const p = spawn(binary(), codexArgs(effort), { cwd, stdio: ['pipe', 'pipe', 'pipe'] });
    let buffer = '', stderr = '', text = '', usage = null, error = null, finished = false, settled = false;
    const finish = (err, value) => { if (settled) return; settled = true; clearTimeout(timer); err ? reject(err) : resolve(value); };
    const timer = setTimeout(() => { p.kill('SIGKILL'); finish(new Error(`Codex excedeu o tempo limite de ${Math.round(timeout / 1000)} s`)); }, timeout);
    const line = raw => {
      let event; try { event = codexEvent(JSON.parse(raw)); } catch { return; }
      if (event.text) text = event.text;
      if (event.usage) usage = event.usage;
      if (event.done) finished = true;
      if (event.error) error = event.error;
    };
    p.stdout.on('data', chunk => {
      buffer += chunk;
      let at; while ((at = buffer.indexOf('\n')) !== -1) { line(buffer.slice(0, at)); buffer = buffer.slice(at + 1); }
    });
    p.stderr.on('data', chunk => { stderr = (stderr + chunk).slice(-1200); });
    p.stdin.on('error', () => {});
    p.stdin.end(prompt);
    p.on('error', err => finish(new Error(err.code === 'ENOENT' ? 'Codex CLI não encontrado neste computador.' : err.message)));
    p.on('close', code => {
      if (buffer.trim()) line(buffer);
      if (code !== 0 || error || !finished || !text.trim()) return finish(new Error(error || stderr.trim() || `Codex encerrou sem resposta (${code})`));
      finish(null, { text: text.trim(), tools: [], usage, modelId: 'codex' });
    });
  });
}
