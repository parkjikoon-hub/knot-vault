/*
 * Codex Obsidian v1.1.0
 * OpenAI Codex CLI + Obsidian CLI(obsidian-skill) 통합 플러그인
 * 기능: Memory Map, 핀 영구 저장, 슬래시 커맨드, 작업 타임라인
 * GitHub: https://github.com/parkjikoon-hub/codex-obsidian
 */

const { Plugin, ItemView, Notice, PluginSettingTab, Setting, Modal } = require('obsidian');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const execAsync = promisify(exec);

const VIEW_TYPE = 'codex-obsidian-view';
const PLUGIN_VERSION = '1.1.0';

const DEFAULT_SETTINGS = {
  codexPath: 'codex',
  openaiApiKey: '',
  model: 'gpt-5.4',
  approvalMode: 'suggest',
  reasoningEffort: 'medium',
  saveFolder: 'Codex Notes',
  autoSave: true,
  includeCurrentNote: true,
  obsidianCliEnabled: true,
  knotAuthor: '',
  maxRelatedNotes: 3,
  maxTokens: 8000,
  pinnedNotePaths: [],
};

const APPROVAL_MODES = {
  suggest: '제안 모드 (명령 실행 전 확인)',
  auto: '자동 모드 (안전한 명령 자동 실행)',
  full: '전체 자동 모드 (모든 명령 자동 실행)',
};

// 슬래시 커맨드 목록
const SLASH_COMMANDS = [
  { name: '/분석', hint: '노트 분석', description: '현재 열린 노트를 분석해서 핵심 내용과 개선점을 알려줘.' },
  { name: '/요약', hint: '노트 요약', description: '현재 노트를 핵심 위주로 요약해줘.' },
  { name: '/코드', hint: '코드 생성', description: '현재 노트 내용을 바탕으로 필요한 코드나 스크립트를 생성해줘.' },
  { name: '/기획서', hint: '기획서 변환', description: '지금까지 대화를 체계적인 기획서 형식으로 정리해줘.' },
  { name: '/회의록', hint: '회의록 작성', description: '대화 내용을 회의록 형식으로 정리해줘.' },
  { name: '/저장', hint: '노트 저장', description: '지금까지 대화를 옵시디언 노트로 저장해줘. 마크다운 형식으로 잘 정리해서.' },
  { name: '/액션', hint: '액션 아이템', description: '대화에서 할 일만 체크리스트로 뽑아줘.' },
  { name: '/초기화', hint: '대화 초기화', description: '__clear__' },
];

// ── Memory Map 서비스 ─────────────────────────────────────────
const STOP_WORDS = new Set([
  '그리고', '그러나', '이것', '저것', '하는', '있는', '없는', 'the', 'and', 'for', 'with', 'that', 'this',
  'from', 'into', 'about', 'note', 'notes', '정리', '내용', '문서', '관련', '키워드', '자료', '수업', '교육',
  'https', 'http', 'www', 'com', 'net', 'org', 'html', 'utm', 'amp', 'nbsp', 'pdf', 'jpg', 'png', 'md',
  '또는', '하지만', '때문에', '위해서', '통해서', '대해서', '입니다', '합니다', '있는지', '있습니다',
]);
const NOISY_TERM = /^(?:https?|www|com|net|org|html?|utm|ref|amp|nbsp|localhost|\d+|[a-f0-9]{8,})$/i;
const MEMORY_INDEX_PATH = '.codex-obsidian/memory/index.json';

class MemoryMapService {
  constructor(app) { this.app = app; this.index = null; }
  async build() {
    const entries = [];
    for (const file of this.app.vault.getMarkdownFiles()) {
      const content = await this.app.vault.cachedRead(file);
      entries.push(this.toEntry(file, content));
    }
    this.index = { version: 2, builtAt: Date.now(), entries };
    await this.persist(this.index);
    return this.index;
  }
  async load() {
    if (this.index) return this.index;
    const adapter = this.app.vault.adapter;
    try {
      if (!await adapter.exists(MEMORY_INDEX_PATH)) return null;
      const parsed = JSON.parse(await adapter.read(MEMORY_INDEX_PATH));
      if (parsed.version !== 2 || !Array.isArray(parsed.entries)) return null;
      this.index = parsed; return parsed;
    } catch { return null; }
  }
  async getStatus() { const index = await this.load(); return { built: Boolean(index), count: index?.entries.length || 0, builtAt: index?.builtAt || null }; }
  async findRelated(currentFile, limit = 8) {
    const index = await this.load() || await this.build();
    const current = index.entries.find(e => e.path === currentFile.path);
    if (!current) return [];
    const stats = this.createCorpusStats(index.entries);
    return index.entries.filter(e => e.path !== current.path).map(e => this.score(current, e, stats)).filter(r => r.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);
  }
  async persist(index) {
    const adapter = this.app.vault.adapter;
    if (!await adapter.exists('.codex-obsidian')) await adapter.mkdir('.codex-obsidian');
    if (!await adapter.exists('.codex-obsidian/memory')) await adapter.mkdir('.codex-obsidian/memory');
    await adapter.write(MEMORY_INDEX_PATH, JSON.stringify(index, null, 2));
  }
  toEntry(file, content) {
    const title = file.basename, folder = file.parent?.path || '';
    const tags = this.extractTags(content);
    const links = [...content.matchAll(/\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]/g)].map(m => m[1].trim()).filter(Boolean);
    const headings = [...content.matchAll(/^#{1,6}\s+(.+)$/gm)].map(m => m[1].trim()).slice(0, 20);
    return { path: file.path, title, folder, tags, links, headings, keywords: this.extractKeywords(title, tags, links, headings, content), terms: this.extractTerms(title, tags, links, headings, content), length: this.tokenize(content).length, mtime: file.stat.mtime };
  }
  extractTags(content) {
    const tags = new Set();
    for (const m of content.matchAll(/(?:^|\s)#([\p{L}\p{N}_/-]+)/gu)) tags.add(m[1]);
    const fm = content.match(/^---\n([\s\S]*?)\n---/);
    const tl = fm?.[1].match(/^tags:\s*(.+)$/m)?.[1];
    if (tl) tl.replace(/[[\]]/g, '').split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean).forEach(t => tags.add(t));
    return [...tags];
  }
  extractKeywords(title, tags, links, headings, content) { return [...Object.entries(this.extractTerms(title, tags, links, headings, content))].sort((a, b) => b[1] - a[1]).slice(0, 30).map(([w]) => w); }
  extractTerms(title, tags, links, headings, content) {
    const counts = new Map();
    const add = (terms, w) => { for (const t of terms) counts.set(t, (counts.get(t) || 0) + w); };
    add(this.tokenize(content), 1); add(this.tokenize(headings.join(' ')), 3); add(this.tokenize(links.join(' ')), 5); add(this.tokenize(tags.join(' ')), 6); add(this.tokenize(title), 8);
    return Object.fromEntries(counts.entries());
  }
  tokenize(content) { return content.replace(/```[\s\S]*?```/g, ' ').replace(/https?:\/\/\S+/gi, ' ').replace(/---[\s\S]*?---/, ' ').replace(/[^\p{L}\p{N}_-]+/gu, ' ').split(/\s+/).map(w => this.normalizeTerm(w)).filter(Boolean); }
  normalizeTerm(word) { const n = word.trim().toLowerCase().replace(/^[-_]+|[-_]+$/g, ''); if (n.length < 2 || n.length > 40 || STOP_WORDS.has(n) || NOISY_TERM.test(n) || /^\d+(?:[-_]\d+)*$/.test(n)) return ''; return n; }
  createCorpusStats(entries) {
    const documentFrequency = new Map(); let totalLength = 0;
    for (const e of entries) { totalLength += Math.max(e.length || 0, 1); for (const term of Object.keys(e.terms || {})) documentFrequency.set(term, (documentFrequency.get(term) || 0) + 1); }
    return { docCount: Math.max(entries.length, 1), avgLength: totalLength / Math.max(entries.length, 1), documentFrequency };
  }
  score(current, candidate, stats) {
    let score = 0; const reasons = [];
    const cAlias = new Set([candidate.title, candidate.path, candidate.path.replace(/\.md$/i, '')]);
    const curAlias = new Set([current.title, current.path, current.path.replace(/\.md$/i, '')]);
    if (current.links.some(l => cAlias.has(l))) { score += 12; reasons.push('현재 노트에서 링크됨'); }
    if (candidate.links.some(l => curAlias.has(l))) { score += 10; reasons.push('현재 노트를 백링크함'); }
    const sharedTags = candidate.tags.filter(t => current.tags.includes(t));
    if (sharedTags.length > 0) { score += sharedTags.length * 5; reasons.push(`같은 태그 ${sharedTags.slice(0, 3).map(t => `#${t}`).join(', ')}`); }
    if (candidate.folder && candidate.folder === current.folder) { score += 3; reasons.push('같은 폴더'); }
    const sharedH = candidate.headings.filter(h => current.headings.includes(h));
    if (sharedH.length > 0) { score += Math.min(sharedH.length * 2, 6); reasons.push('비슷한 소제목'); }
    const tm = this.scoreTerms(current, candidate, stats);
    if (tm.score > 0) { score += tm.score; reasons.push(`핵심어 ${tm.terms.slice(0, 4).join(', ')}`); }
    if (Math.max(0, (Date.now() - candidate.mtime) / 86400000) < 14) { score += 1; reasons.push('최근 수정됨'); }
    return { path: candidate.path, title: candidate.title, score, reasons: reasons.slice(0, 4) };
  }
  scoreTerms(current, candidate, stats) {
    const ct = current.terms || {}, cdt = candidate.terms || {}, matches = [];
    const cLen = Math.max(candidate.length || 1, 1), k1 = 1.2, b = 0.75;
    for (const term of Object.keys(ct)) {
      const tf = cdt[term] || 0; if (tf <= 0) continue;
      const df = stats.documentFrequency.get(term) || 1;
      const idf = Math.log(1 + (stats.docCount - df + 0.5) / (df + 0.5));
      if (idf < 0.25) continue;
      matches.push({ term, score: idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (cLen / stats.avgLength)))) * Math.min(Math.sqrt(ct[term]), 4) });
    }
    matches.sort((a, b) => b.score - a.score);
    return { score: Math.min(matches.reduce((s, m) => s + m.score, 0), 12), terms: matches.slice(0, 6).map(m => m.term) };
  }
}

// ── Obsidian CLI 헬퍼 (obsidian-skill 기반) ────────────────
class ObsidianCLI {
  static async run(command) {
    try {
      const { stdout } = await execAsync(`obsidian ${command}`, { timeout: 10000 });
      return stdout.trim();
    } catch { return null; }
  }

  static async isAvailable() {
    return (await this.run('--version')) !== null;
  }

  static async searchRelated(query, limit = 3) {
    const r = await this.run(`search query="${query.slice(0, 80)}" limit=${limit} format=json`);
    if (!r) return [];
    try { return JSON.parse(r) || []; } catch { return []; }
  }

  static async readNote(name) {
    return await this.run(`read file="${name}"`);
  }

  // obsidian-skill 방식 — KNOT 프론트매터 포함 노트 생성
  static async createNote({ name, content, folder, author, tags, type }) {
    const date = new Date().toISOString().slice(0, 10);
    const authorLine = author ? `\n  - "[[${author}]]"` : '\n  - ""';
    const tagLines = (tags || ['codex-obsidian']).map(t => `  - ${t}`).join('\n');
    const front = `---\ntype: ${type || 'note'}\naliases: []\ndescription: "AI-generated note from Codex Obsidian on ${date}."\nauthor:${authorLine}\ndate created: ${date}\ndate modified: ${date}\ntags:\n${tagLines}\n---\n\n`;
    const escaped = (front + content).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
    const p = folder ? `${folder}/${name}.md` : `${name}.md`;
    return (await this.run(`create name="${name}" path="${p}" content="${escaped}" silent overwrite`)) !== null;
  }

  static async reloadPlugin(id) { return await this.run(`plugin:reload id=${id}`); }
  static async getErrors() { return await this.run('dev:errors'); }
  static async takeScreenshot(p) { return await this.run(`dev:screenshot path="${p}"`); }
}

// ── Codex CLI 헬퍼 ─────────────────────────────────────────
class CodexCLI {
  static async isAvailable(codexPath) {
    try {
      const { stdout } = await execAsync(`${codexPath} --version`, { timeout: 5000, shell: true });
      return { available: true, version: stdout.trim() };
    } catch {
      return { available: false, version: null };
    }
  }

  // Codex CLI를 스트리밍으로 실행
  // shell:true → Windows에서 PATH 인식 문제 해결
  static runStreaming({ codexPath, prompt, model, approvalMode, reasoningEffort, cwd, onData, onEnd, onError }) {
    const isReasoning = model === 'o3' || model.startsWith('o4');
    const args = [prompt, '--model', model, '--approval-mode', approvalMode, '--no-interactive'];
    if (isReasoning && reasoningEffort) args.push('--reasoning-effort', reasoningEffort);
    const proc = spawn(codexPath, args, {
      cwd: cwd || process.env.HOME || process.env.USERPROFILE,
      env: { ...process.env },
      shell: true,
      timeout: 120000,
    });

    let buffer = '';
    proc.stdout.on('data', d => {
      buffer += d.toString();
      onData && onData(d.toString());
    });
    proc.stderr.on('data', d => onError && onError(d.toString()));
    proc.on('close', () => onEnd && onEnd(buffer));
    proc.on('error', e => onError && onError(e.message));
    return proc;
  }

  // 단순 실행 (비스트리밍)
  static async run({ codexPath, prompt, model, approvalMode }) {
    return new Promise((resolve, reject) => {
      let out = '', err = '';
      const proc = spawn(codexPath, [prompt, '--model', model, '--approval-mode', approvalMode, '--no-interactive'], {
        env: { ...process.env },
        timeout: 60000,
      });
      proc.stdout.on('data', d => out += d.toString());
      proc.stderr.on('data', d => err += d.toString());
      proc.on('close', code => code === 0 ? resolve(out.trim()) : reject(new Error(err || `종료 코드: ${code}`)));
      proc.on('error', reject);
    });
  }
}

// ── 관련 노트 선택 모달 ────────────────────────────────────
class RelatedNotesModal extends Modal {
  constructor(app, notes, onSelect) {
    super(app);
    this.notes = notes;
    this.onSelect = onSelect;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h3', { text: '📌 컨텍스트로 추가할 노트 선택' });
    this.notes.forEach(note => {
      const name = note.name || note.file || String(note);
      const row = contentEl.createDiv();
      row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:8px;cursor:pointer;margin-bottom:6px;background:var(--background-secondary);';
      row.createEl('span', { text: '📄 ' + name });
      row.onmouseenter = () => row.style.background = 'var(--background-modifier-hover)';
      row.onmouseleave = () => row.style.background = 'var(--background-secondary)';
      row.onclick = () => { this.onSelect(name); this.close(); };
    });
    contentEl.createEl('button', { text: '닫기' }).onclick = () => this.close();
  }

  onClose() { this.contentEl.empty(); }
}

// ── 명령 확인 모달 ─────────────────────────────────────────
class CommandConfirmModal extends Modal {
  constructor(app, command, onApprove, onReject) {
    super(app);
    this.command = command;
    this.onApprove = onApprove;
    this.onReject = onReject;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h3', { text: '⚠️ 명령 실행 확인' });
    contentEl.createEl('p', { text: 'Codex가 다음 명령을 실행하려 합니다:' });
    const code = contentEl.createEl('pre');
    code.style.cssText = 'background:var(--background-secondary);padding:12px;border-radius:8px;font-family:monospace;font-size:13px;white-space:pre-wrap;';
    code.textContent = this.command;
    const row = contentEl.createDiv();
    row.style.cssText = 'display:flex;gap:8px;margin-top:16px;';
    const ok = row.createEl('button', { text: '✅ 실행', cls: 'mod-cta' });
    ok.onclick = () => { this.onApprove(); this.close(); };
    const no = row.createEl('button', { text: '❌ 취소' });
    no.onclick = () => { this.onReject(); this.close(); };
  }

  onClose() { this.contentEl.empty(); }
}

// ── 채팅 사이드바 뷰 ──────────────────────────────────────
class CodexObsidianView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.messages = [];
    this.isLoading = false;
    this.cliAvailable = false;
    this.codexAvailable = false;
    this.codexVersion = '';
    this.currentProcess = null;
    this.memoryMap = new MemoryMapService(plugin.app);
    this.relatedNotes = [];
    this.isMemoryMapExpanded = true;
    this.slashDropdownEl = null;
    this.selectedSlashIndex = 0;
  }

  getViewType() { return VIEW_TYPE; }
  getDisplayText() { return 'Codex Obsidian'; }
  getIcon() { return 'terminal'; }

  async onOpen() {
    this.cliAvailable = await ObsidianCLI.isAvailable();
    const codexInfo = await CodexCLI.isAvailable(this.plugin.settings.codexPath);
    this.codexAvailable = codexInfo.available;
    this.codexVersion = codexInfo.version || '';
    this.render();
  }

  async onClose() {
    if (this.currentProcess) { this.currentProcess.kill(); this.currentProcess = null; }
  }

  render() {
    const root = this.containerEl.children[1];
    root.empty();
    root.addClass('codex-obsidian-container');

    // 헤더
    const header = root.createDiv('codex-obsidian-header');

    // 1행: 로고 + 이름 + 버전 + 상태
    const titleRow = header.createDiv('codex-header-title');
    const logoEl = titleRow.createDiv('codex-logo');
    // OpenAI 실제 로고 (꽃잎/다각형 심볼)
    logoEl.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" fill="white"/>
    </svg>`;
    titleRow.createEl('span', { text: 'Codex Obsidian', cls: 'codex-title-text' });
    titleRow.createEl('span', { text: `v${PLUGIN_VERSION}`, cls: 'codex-version-badge' });
    const hasApiKey = !!(this.plugin.settings.openaiApiKey);
    titleRow.createEl('span', {
      text: hasApiKey ? '● API' : '✗ API 키 필요',
      cls: hasApiKey ? 'codex-cli-dot ok' : 'codex-cli-dot err'
    });
    titleRow.createEl('span', {
      text: this.cliAvailable ? '● Obs CLI' : '○ Obs CLI',
      cls: this.cliAvailable ? 'codex-cli-dot ok' : 'codex-cli-dot'
    });

    // 2행: 모델 선택 + 승인 모드 + 토큰 슬라이더 + 컨텍스트
    const controlRow = header.createDiv({ cls: 'codex-control-row' });

    const modelSelect = controlRow.createEl('select', { cls: 'codex-model-select' });
    // reasoning_effort: minimum/low/medium/high/ultra_high → 모든 모델에 적용
    [
      { value: 'gpt-5.3', label: 'GPT 5.3' },
      { value: 'gpt-5.4', label: 'GPT 5.4' },
      { value: 'gpt-5.5', label: 'GPT 5.5' },
    ].forEach(({ value, label }) => {
      const opt = modelSelect.createEl('option', { value, text: label });
      if (value === this.plugin.settings.model) opt.selected = true;
    });

    // GPT 5.x 전용 reasoning_effort: minimum / low / medium / high / ultra_high
    const reasonSelect = controlRow.createEl('select', { cls: 'codex-model-select' });
    [
      { value: 'minimum',    label: '사고: Minimum' },
      { value: 'low',        label: '사고: Low' },
      { value: 'medium',     label: '사고: Medium' },
      { value: 'high',       label: '사고: High' },
      { value: 'ultra_high', label: '사고: Ultra High' },
    ].forEach(({ value, label }) => {
      const opt = reasonSelect.createEl('option', { value, text: label });
      if (value === (this.plugin.settings.reasoningEffort || 'medium')) opt.selected = true;
    });

    const modeSelect = controlRow.createEl('select', { cls: 'codex-model-select' });
    [
      { value: 'suggest', label: '제안 모드' },
      { value: 'auto',    label: '자동 모드' },
      { value: 'full',    label: '전체 자동' },
    ].forEach(({ value, label }) => {
      const opt = modeSelect.createEl('option', { value, text: label });
      if (value === this.plugin.settings.approvalMode) opt.selected = true;
    });

    modelSelect.onchange = async () => {
      this.plugin.settings.model = modelSelect.value;
      await this.plugin.saveSettings();
    };
    reasonSelect.onchange = async () => {
      this.plugin.settings.reasoningEffort = reasonSelect.value;
      await this.plugin.saveSettings();
    };
    modeSelect.onchange = async () => {
      this.plugin.settings.approvalMode = modeSelect.value;
      await this.plugin.saveSettings();
    };

    // Memory Map 패널
    this.memoryMapEl = root.createDiv('codex-memory-map-panel');
    this.renderMemoryMapPanel();

    // 컨텍스트 바
    this.contextBar = root.createDiv('codex-context-bar');
    this.pinnedBar = root.createDiv('codex-pinned-bar');
    this.updateContextBar();

    // 메시지 영역
    this.messagesEl = root.createDiv('codex-messages');
    this.renderMessages();

    // 툴바 (2열 4행 = 8개, 공통6 + Codex전용2)
    const toolbar = root.createDiv('codex-toolbar');
    const SVGS = {
      summary: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
      search: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
      plan: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>',
      meeting: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      save: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
      code: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
      stop: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>',
      reset: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>',
    };
    [
      { svg: SVGS.summary, label: '노트 분석', fn: () => this.quickSend('현재 열린 노트를 분석해서 핵심 내용과 개선점을 알려줘.') },
      { svg: SVGS.search, label: '관련 검색', fn: () => this.searchRelatedNotes() },
      { svg: SVGS.plan, label: '기획서 변환', fn: () => this.quickSend('지금까지 대화를 체계적인 기획서 형식으로 정리해줘.') },
      { svg: SVGS.meeting, label: '회의록 작성', fn: () => this.quickSend('대화 내용을 회의록 형식으로 정리해줘.') },
      { svg: SVGS.save, label: '노트 저장', fn: () => this.quickSend('지금까지 대화를 옵시디언 노트로 저장해줘. 마크다운 형식으로 잘 정리해서.') },
      { svg: SVGS.code, label: '코드 생성', fn: () => this.quickSend('현재 노트 내용을 바탕으로 필요한 코드나 스크립트를 생성해줘.') },
      { svg: SVGS.stop, label: '생성 중지', fn: () => this.stopGeneration() },
      { svg: SVGS.reset, label: '초기화', fn: () => this.clearChat() },
    ].forEach(({ svg, label, fn }) => {
      const btn = toolbar.createEl('button', { cls: 'codex-toolbar-btn' });
      const iconEl = btn.createSpan();
      iconEl.innerHTML = svg;
      btn.createEl('span', { text: label });
      btn.onclick = fn;
    });

    // 입력 영역
    const inputArea = root.createDiv('codex-input-area');
    const inputWrapper = inputArea.createDiv('codex-input-wrapper');
    this.slashDropdownEl = inputWrapper.createDiv({ cls: 'codex-slash-dropdown' });
    this.slashDropdownEl.style.display = 'none';
    const inputRow = inputWrapper.createDiv('codex-input-row');
    this.inputEl = inputRow.createEl('textarea', {
      cls: 'codex-input',
      attr: { placeholder: 'GPT에게 메시지를 입력하세요... (Enter 전송 / Shift+Enter 줄바꿈)\n/ 를 입력하면 커맨드 메뉴가 열립니다', rows: '1' }
    });
    this.sendBtn = inputRow.createEl('button', { cls: 'codex-send-btn', text: '➤' });
    inputArea.createDiv({ cls: 'codex-hint', text: 'Enter: 전송  |  Shift+Enter: 줄바꿈  |  /: 커맨드 메뉴' });

    this.inputEl.addEventListener('keydown', e => {
      if (this.handleSlashKeydown(e)) return;
      if (e.key === 'Enter' && (e.shiftKey || e.ctrlKey)) {
        e.preventDefault();
        const start = this.inputEl.selectionStart;
        const end = this.inputEl.selectionEnd;
        const val = this.inputEl.value;
        this.inputEl.value = val.slice(0, start) + '\n' + val.slice(end);
        this.inputEl.selectionStart = this.inputEl.selectionEnd = start + 1;
        this.inputEl.dispatchEvent(new Event('input'));
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
        e.preventDefault();
        this.handleSend();
      }
    });
    this.sendBtn.onclick = () => this.handleSend();
    this.inputEl.addEventListener('input', () => {
      this.inputEl.style.height = 'auto';
      this.inputEl.style.height = Math.min(this.inputEl.scrollHeight, 120) + 'px';
      this.renderSlashCommands();
    });
    this.inputEl.addEventListener('blur', () => { window.setTimeout(() => this.hideSlashCommands(), 120); });

    if (this.messages.length === 0) this.showEmpty();

    this.registerEvent(this.app.workspace.on('file-open', () => { this.relatedNotes = []; this.renderMemoryMapPanel(); }));
  }

  showEmpty() {
    this.messagesEl.empty();
    const el = this.messagesEl.createDiv('codex-empty');
    const logoEl = el.createDiv({ cls: 'codex-empty-logo' });
    // OpenAI 실제 로고 (꽃잎 심볼)
    logoEl.innerHTML = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="32" fill="#10a37f"/>
      <path transform="translate(12,12) scale(1.67)" d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" fill="white"/>
    </svg>`;
    el.createEl('p', { text: 'Codex Obsidian에 오신 것을 환영합니다!', cls: 'codex-welcome-text' });
  }

  updateContextInfo() {
    if (!this.contextInfoEl) return;
    const totalChars = this.messages.reduce((sum, m) => sum + m.content.length, 0);
    const tokens = Math.round(totalChars / 4);
    this.contextInfoEl.textContent = `컨텍스트: ~${tokens.toLocaleString()} 토큰`;
  }

  updateContextBar() {
    if (!this.contextBar) return;
    this.contextBar.empty();
    const file = this.app.workspace.getActiveFile();
    if (file && this.plugin.settings.includeCurrentNote) {
      const row = this.contextBar.createDiv('context-label');
      row.createEl('span', { text: '📎 ' });
      row.createEl('span', { cls: 'context-file', text: file.basename });
      if (this.cliAvailable) {
        const btn = this.contextBar.createEl('button', { text: '🔍 관련 검색', cls: 'context-search-btn' });
        btn.onclick = () => this.searchRelatedNotes();
      }
    } else {
      this.contextBar.createEl('span', { text: '📎 노트를 열면 자동으로 컨텍스트에 포함됩니다' });
    }
    if (!this.pinnedBar) return;
    this.pinnedBar.empty();
    (this.plugin.settings.pinnedNotePaths || []).forEach(notePath => {
      const name = notePath.split('/').pop()?.replace(/\.md$/i, '') || notePath;
      const tag = this.pinnedBar.createDiv('pinned-note-tag');
      tag.createEl('span', { text: '📌 ' + name });
      const rm = tag.createEl('button', { text: '×', cls: 'pinned-remove' });
      rm.onclick = async () => { await this.plugin.unpinNote(notePath); this.updateContextBar(); };
    });
  }

  // ── Memory Map ─────────────────────────────────────────────
  async renderMemoryMapPanel() {
    if (!this.memoryMapEl) return;
    this.memoryMapEl.empty();
    const status = await this.memoryMap.getStatus();
    const header = this.memoryMapEl.createDiv({ cls: 'codex-memory-map-header' });

    const toggleBtn = header.createSpan({ cls: 'codex-memory-map-toggle' });
    toggleBtn.textContent = this.isMemoryMapExpanded ? '▼' : '▶';
    toggleBtn.onclick = async () => { this.isMemoryMapExpanded = !this.isMemoryMapExpanded; await this.renderMemoryMapPanel(); };

    const titleSpan = header.createSpan({ cls: 'codex-memory-map-title' });
    titleSpan.textContent = `🗺️ ${status.built ? `Memory Map · ${status.count}개 노트` : 'Memory Map (미구축)'}`;
    titleSpan.onclick = async () => { this.isMemoryMapExpanded = !this.isMemoryMapExpanded; await this.renderMemoryMapPanel(); };

    if (this.relatedNotes.length > 0) {
      const cb = header.createEl('button', { cls: 'codex-memory-btn', text: '지우기' });
      cb.onclick = async () => { this.relatedNotes = []; await this.renderMemoryMapPanel(); };
    }
    const buildBtn = header.createEl('button', { cls: 'codex-memory-btn', text: status.built ? '재구축' : '구축' });
    buildBtn.onclick = async () => { buildBtn.textContent = '구축 중...'; await this.memoryMap.build(); await this.renderMemoryMapPanel(); new Notice('Memory Map 구축 완료!'); };
    const findBtn = header.createEl('button', { cls: 'codex-memory-btn', text: '관련 노트 찾기' });
    if (!this.app.workspace.getActiveFile()) findBtn.disabled = true;
    findBtn.onclick = async () => {
      const file = this.app.workspace.getActiveFile();
      if (!file) { new Notice('노트를 먼저 열어주세요.'); return; }
      findBtn.textContent = '검색 중...';
      this.relatedNotes = await this.memoryMap.findRelated(file);
      this.isMemoryMapExpanded = true;
      await this.renderMemoryMapPanel();
    };
    if (!this.isMemoryMapExpanded) return;
    if (this.relatedNotes.length === 0) {
      const hint = this.memoryMapEl.createDiv();
      hint.style.cssText = 'font-size:11px;color:var(--text-muted);padding:4px 8px;';
      hint.textContent = status.built ? '노트를 열고 "찾기"를 눌러보세요.' : '"구축"을 눌러 Memory Map을 만드세요.';
      return;
    }
    const list = this.memoryMapEl.createDiv();
    list.style.cssText = 'padding:4px 8px;';
    for (const result of this.relatedNotes) {
      const chip = list.createDiv();
      chip.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:4px 6px;border-radius:6px;background:var(--background-secondary);margin-bottom:3px;cursor:pointer;font-size:12px;';
      const info = chip.createDiv(); info.style.cssText = 'flex:1;min-width:0;';
      info.createEl('span', { text: result.title }).style.cssText = 'font-weight:600;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
      if (result.reasons[0]) info.createEl('span', { text: result.reasons[0] }).style.cssText = 'font-size:10px;color:var(--text-muted);';
      const addBtn = chip.createEl('button', { text: '📌' });
      addBtn.style.cssText = 'background:none;border:none;cursor:pointer;padding:2px 4px;font-size:13px;';
      addBtn.onclick = async (e) => { e.stopPropagation(); await this.plugin.pinNote(result.path); this.updateContextBar(); new Notice(`📌 "${result.title}" 핀 추가됨`); };
      chip.onclick = async () => { const f = this.app.vault.getAbstractFileByPath(result.path); if (f) await this.app.workspace.getLeaf(false).openFile(f); };
    }
  }

  // ── 슬래시 커맨드 ──────────────────────────────────────────
  getSlashQuery() {
    if (!this.inputEl) return null;
    const value = this.inputEl.value, cursor = this.inputEl.selectionStart ?? value.length, before = value.slice(0, cursor);
    if (!before.startsWith('/') || before.includes('\n') || before.includes(' ')) return null;
    return before.toLowerCase();
  }
  getFilteredSlashCommands() { const q = this.getSlashQuery(); if (q === null) return []; return SLASH_COMMANDS.filter(c => c.name.startsWith(q)); }
  renderSlashCommands() {
    if (!this.slashDropdownEl) return;
    const commands = this.getFilteredSlashCommands();
    this.slashDropdownEl.empty();
    if (commands.length === 0) { this.hideSlashCommands(); return; }
    this.selectedSlashIndex = Math.min(this.selectedSlashIndex, commands.length - 1);
    this.slashDropdownEl.style.display = 'block';
    commands.forEach((cmd, i) => {
      const item = this.slashDropdownEl.createDiv();
      item.style.cssText = `display:flex;align-items:center;gap:8px;padding:6px 10px;cursor:pointer;border-radius:6px;${i === this.selectedSlashIndex ? 'background:var(--interactive-accent);color:var(--text-on-accent);' : ''}`;
      item.createEl('span', { text: cmd.name }).style.cssText = 'font-weight:600;font-size:13px;min-width:70px;';
      item.createEl('span', { text: cmd.hint }).style.cssText = 'font-size:12px;opacity:0.8;';
      item.addEventListener('mousedown', e => { e.preventDefault(); this.insertSlashCommand(cmd); });
    });
  }
  insertSlashCommand(cmd) {
    if (cmd.description === '__clear__') { this.clearChat(); this.inputEl.value = ''; this.hideSlashCommands(); return; }
    this.inputEl.value = ''; this.hideSlashCommands(); this.quickSend(cmd.description);
  }
  handleSlashKeydown(e) {
    if (this.slashDropdownEl?.style.display !== 'block') return false;
    const commands = this.getFilteredSlashCommands();
    if (e.key === 'ArrowDown') { e.preventDefault(); this.selectedSlashIndex = Math.min(this.selectedSlashIndex + 1, commands.length - 1); this.renderSlashCommands(); return true; }
    if (e.key === 'ArrowUp') { e.preventDefault(); this.selectedSlashIndex = Math.max(this.selectedSlashIndex - 1, 0); this.renderSlashCommands(); return true; }
    if (e.key === 'Tab' || e.key === 'Enter') { const cmd = commands[this.selectedSlashIndex]; if (cmd) { e.preventDefault(); this.insertSlashCommand(cmd); return true; } }
    if (e.key === 'Escape') { e.preventDefault(); this.hideSlashCommands(); return true; }
    return false;
  }
  hideSlashCommands() { if (this.slashDropdownEl) this.slashDropdownEl.style.display = 'none'; this.selectedSlashIndex = 0; }

  async searchRelatedNotes() {
    if (!this.cliAvailable) { new Notice('Obsidian CLI가 필요합니다.'); return; }
    const file = this.app.workspace.getActiveFile();
    const query = file ? file.basename : this.inputEl.value.trim();
    if (!query) { new Notice('노트를 열거나 검색어를 입력해주세요.'); return; }
    new Notice('관련 노트를 검색 중...');
    const results = await ObsidianCLI.searchRelated(query, this.plugin.settings.maxRelatedNotes);
    if (!results.length) { new Notice('관련 노트를 찾지 못했습니다.'); return; }
    new RelatedNotesModal(this.app, results, async name => {
      await this.plugin.pinNote(name);
      this.updateContextBar();
      new Notice(`📌 "${name}" 핀 추가됐습니다.`);
    }).open();
  }

  renderMessages() {
    if (!this.messagesEl) return;
    this.messagesEl.empty();
    if (this.messages.length === 0) { this.showEmpty(); return; }

    this.messages.forEach(msg => {
      const el = this.messagesEl.createDiv(`codex-message ${msg.role}`);

      if (msg.role === 'system-info') {
        el.style.cssText = 'font-size:12px;color:var(--text-muted);padding:4px 8px;font-family:monospace;';
        el.textContent = msg.content;
        return;
      }

      const bubble = el.createDiv('codex-message-bubble');
      bubble.innerHTML = msg.content
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/```[\s\S]*?```/g, m => `<pre style="background:var(--background-secondary);padding:8px;border-radius:6px;font-family:monospace;font-size:12px;overflow-x:auto;">${m.replace(/```\w*\n?/g, '').replace(/```/g, '')}</pre>`)
        .replace(/\n/g, '<br>');
      el.createDiv({ cls: 'codex-message-time', text: msg.time || '' });

      if (msg.role === 'assistant') {
        const acts = el.createDiv('codex-message-actions');
        const copy = acts.createEl('button', { text: '📋 복사', cls: 'codex-msg-btn' });
        copy.onclick = () => { navigator.clipboard.writeText(msg.content); new Notice('복사됐습니다.'); };
        const save = acts.createEl('button', { text: '💾 노트 저장', cls: 'codex-msg-btn' });
        save.onclick = () => this.saveAsNote(msg.content);
      }
    });

    if (this.isLoading) {
      const typing = this.messagesEl.createDiv('codex-typing');
      [0,1,2].forEach(() => typing.createEl('span'));
    }
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    this.updateContextInfo();
  }

  async handleSend() {
    const text = this.inputEl.value.trim();
    if (!text || this.isLoading) return;
    this.inputEl.value = '';
    this.inputEl.style.height = 'auto';
    this.hideSlashCommands();
    await this.sendMessage(text);
  }

  quickSend(text) { this.sendMessage(text); }

  stopGeneration() {
    if (this.currentProcess) {
      this.currentProcess.kill();
      this.currentProcess = null;
      this.isLoading = false;
      this.sendBtn.disabled = false;
      this.messages.push({ role: 'system-info', content: '⏹ 생성이 중지됐습니다.', time: '' });
      this.renderMessages();
    }
  }

  async sendMessage(userText) {
    const { openaiApiKey } = this.plugin.settings;
    if (!openaiApiKey) {
      new Notice('⚠️ 설정에서 OpenAI API 키를 먼저 입력해주세요.');
      return;
    }
    const now = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    this.messages.push({ role: 'user', content: userText, time: now });
    this.isLoading = true;
    this.sendBtn.disabled = true;
    this.renderMessages();
    this.updateContextBar();

    // 타임라인 생성
    const timelineEl = this.messagesEl.createDiv({ cls: 'codex-message assistant' });
    timelineEl.style.cssText = 'font-size:11px;color:var(--text-muted);padding:6px 10px;border-left:2px solid #10a37f;margin-bottom:6px;';
    const addStep = (text) => { const s = timelineEl.createDiv(); s.style.padding = '2px 0'; s.textContent = `▸ ${text}`; if (this.messagesEl) this.messagesEl.scrollTop = this.messagesEl.scrollHeight; };
    addStep('컨텍스트 수집 중...');
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;

    try {
      const context = await this.buildContext();
      addStep('OpenAI API 호출 중...');
      let reply;
      if (openaiApiKey) {
        reply = await this.callOpenAI(userText, context);
      } else {
        addStep('Codex CLI 실행 중...');
        const fullPrompt = context ? `${context}\n\n사용자 요청: ${userText}` : userText;
        reply = await this.runCodex(fullPrompt);
      }
      addStep('응답 완료');
      timelineEl.remove();
      const t = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
      this.messages.push({ role: 'assistant', content: reply, time: t });
      if (this.plugin.settings.autoSave && this.isNoteRequest(userText)) await this.saveAsNote(reply);
    } catch (e) {
      timelineEl.remove();
      this.messages.push({ role: 'assistant', content: `오류: ${e.message}`, time: now });
      new Notice(`GPT 오류: ${e.message}`);
    } finally {
      this.isLoading = false;
      this.sendBtn.disabled = false;
      this.currentProcess = null;
      this.renderMessages();
    }
  }

  async runCodex(prompt) {
    const { codexPath, model, approvalMode, reasoningEffort } = this.plugin.settings;
    return new Promise((resolve, reject) => {
      let output = '';
      this.currentProcess = CodexCLI.runStreaming({
        codexPath, prompt, model, approvalMode, reasoningEffort,
        onData: (chunk) => {
          output += chunk;
          if (this.messages.length > 0) {
            const last = this.messages[this.messages.length - 1];
            if (last.role === 'streaming') { last.content = output; this.renderMessages(); }
          }
        },
        onEnd: () => resolve(output.trim() || '응답을 받지 못했습니다.'),
        onError: (err) => { if (!output) reject(new Error(err)); },
      });
    });
  }

  // Codex CLI 없을 때 OpenAI API 직접 호출
  async callOpenAI(userMessage, context) {
    const { openaiApiKey, model, reasoningEffort } = this.plugin.settings;
    const url = 'https://api.openai.com/v1/chat/completions';

    const systemPrompt = `당신은 Obsidian 노트 전문 AI 어시스턴트입니다.

## 핵심 원칙
- 노트 분석 시 **핵심 개념, 구조, 통찰, 개선점**을 구체적이고 상세하게 제공합니다.
- 단순 요약이 아닌 깊이 있는 분석을 수행합니다. 표, 목록, 섹션을 적극 활용하세요.
- 사용자가 "요약"을 요청해도 핵심 인사이트와 맥락을 빠짐없이 포함합니다.
- 기획서, 회의록, 코드 생성 등은 옵시디언 마크다운 형식으로 작성합니다.
- 노트 저장 시 반드시 YAML 프론트매터를 포함하세요.
- 한국어로 답변합니다.${context ? `\n\n## 컨텍스트\n${context}` : ''}`;

    const history = this.messages.slice(0, -1)
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role, content: m.content }));

    const body = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: userMessage }
      ],
    };
    // reasoning_effort는 GPT-5.x 및 o-시리즈 모두 지원
    if (reasoningEffort) {
      body.reasoning_effort = reasoningEffort;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const e = await res.json();
      throw new Error(e.error?.message || `API 오류 ${res.status}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '응답을 받지 못했습니다.';
  }

  async buildContext() {
    let ctx = '';
    if (this.plugin.settings.includeCurrentNote) {
      const file = this.app.workspace.getActiveFile();
      if (file?.extension === 'md') {
        const content = await this.app.vault.read(file);
        ctx += `[현재 노트: ${file.basename}]\n${content.slice(0, 3000)}`;
      }
    }
    for (const notePath of (this.plugin.settings.pinnedNotePaths || [])) {
      const file = this.app.vault.getAbstractFileByPath(notePath);
      if (file && 'extension' in file) {
        const content = await this.app.vault.read(file);
        ctx += `\n\n[핀 노트: ${notePath.split('/').pop()?.replace(/\.md$/i, '') || notePath}]\n${content.slice(0, 2000)}`;
      } else if (this.cliAvailable) {
        const content = await ObsidianCLI.readNote(notePath);
        if (content) ctx += `\n\n[핀 노트: ${notePath}]\n${content.slice(0, 2000)}`;
      }
    }
    return ctx;
  }

  isNoteRequest(text) {
    return ['노트로 저장', '저장해줘', '파일로 만들어', '문서로 만들어', '기획서로', '회의록으로', '정리해서 저장'].some(k => text.includes(k));
  }

  async saveAsNote(content) {
    const date = new Date().toISOString().slice(0, 10);
    const rawTitle = content.split('\n').find(l => l.trim())?.replace(/^#+\s*/, '').replace(/[<>:"\/\\|?*]/g, '').trim() || '새 노트';
    const fileName = `${date} ${rawTitle.slice(0, 50)}`;
    const { saveFolder, knotAuthor } = this.plugin.settings;

    if (this.cliAvailable) {
      const ok = await ObsidianCLI.createNote({
        name: fileName, content, folder: saveFolder,
        author: knotAuthor, tags: ['codex-obsidian', 'ai-generated'], type: 'note'
      });
      if (ok) { new Notice(`✅ 노트 저장 완료 (CLI): ${fileName}`); return; }
    }

    const frontmatter = `---\ntype: note\naliases: []\ndescription: "AI-generated note from Codex Obsidian."\nauthor:\n  - "${knotAuthor || ''}"\ndate created: ${date}\ndate modified: ${date}\ntags:\n  - codex-obsidian\n  - ai-generated\n---\n\n`;
    try {
      if (!this.app.vault.getAbstractFileByPath(saveFolder)) await this.app.vault.createFolder(saveFolder);
      const p = `${saveFolder}/${fileName}.md`;
      await this.app.vault.create(p, frontmatter + content);
      new Notice(`✅ 노트 저장 완료: ${fileName}`);
      const file = this.app.vault.getAbstractFileByPath(p);
      if (file) await this.app.workspace.getLeaf('tab').openFile(file);
    } catch (e) { new Notice(`노트 저장 실패: ${e.message}`); }
  }

  clearChat() {
    this.messages = [];
    this.renderMessages();
    new Notice('대화가 초기화됐습니다.');
  }
}

// ── 설정 탭 ────────────────────────────────────────────────
class CodexObsidianSettings extends PluginSettingTab {
  constructor(app, plugin) { super(app, plugin); this.plugin = plugin; }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: '⚙️ Codex Obsidian 설정' });

    // OpenAI API 키 (선택사항)
    containerEl.createEl('h3', { text: 'OpenAI API 키 (선택사항)' });
    const apiKeyDesc = containerEl.createEl('p', { cls: 'setting-item-description' });
    apiKeyDesc.appendText('Codex CLI 대신 OpenAI API를 직접 사용할 경우 입력하세요. → ');
    const apiKeyLink = apiKeyDesc.createEl('a', { text: 'platform.openai.com/api-keys 🔗', href: 'https://platform.openai.com/api-keys' });
    apiKeyLink.style.color = 'var(--text-accent)';
    apiKeyLink.style.fontWeight = '600';

    new Setting(containerEl).setName('OpenAI API 키').setDesc('sk-... 로 시작하는 API 키를 입력하세요 (선택사항)')
      .addText(t => t.setPlaceholder('sk-...').setValue(this.plugin.settings.openaiApiKey)
        .onChange(async v => { this.plugin.settings.openaiApiKey = v.trim(); await this.plugin.saveSettings(); }));

    containerEl.createEl('h3', { text: 'Codex CLI' });

    // Codex 설치 안내 링크
    const codexLinkEl = containerEl.createEl('p', { cls: 'setting-item-description' });
    codexLinkEl.appendText('Codex CLI가 없으신가요? → ');
    const codexLink = codexLinkEl.createEl('a', { text: 'OpenAI Codex 설치 안내 🔗', href: 'https://github.com/openai/codex' });
    codexLink.style.color = 'var(--text-accent)';
    codexLink.style.fontWeight = '600';
    codexLinkEl.createEl('br');
    codexLinkEl.appendText('터미널에서: ');
    const codexCode = codexLinkEl.createEl('code', { text: 'npm install -g @openai/codex@latest' });
    codexCode.style.background = 'var(--background-secondary)';
    codexCode.style.padding = '1px 6px';
    codexCode.style.borderRadius = '4px';

    new Setting(containerEl).setName('Codex 실행 경로').setDesc('기본값: codex (PATH에 등록된 경우). 전체 경로 입력도 가능.')
      .addText(t => t.setPlaceholder('codex').setValue(this.plugin.settings.codexPath)
        .onChange(async v => { this.plugin.settings.codexPath = v.trim() || 'codex'; await this.plugin.saveSettings(); }));

    new Setting(containerEl).setName('모델').setDesc('사용할 GPT 모델 선택')
      .addDropdown(d => d
        .addOption('gpt-5.3', 'GPT 5.3')
        .addOption('gpt-5.4', 'GPT 5.4')
        .addOption('gpt-5.5', 'GPT 5.5 (최고 성능)')
        .setValue(this.plugin.settings.model)
        .onChange(async v => { this.plugin.settings.model = v; await this.plugin.saveSettings(); }));

    new Setting(containerEl).setName('승인 모드').setDesc('Codex가 명령을 실행할 때 승인 방식')
      .addDropdown(d => d
        .addOption('suggest', '제안 모드 (안전)')
        .addOption('auto', '자동 모드')
        .addOption('full', '전체 자동')
        .setValue(this.plugin.settings.approvalMode)
        .onChange(async v => { this.plugin.settings.approvalMode = v; await this.plugin.saveSettings(); }));

    containerEl.createEl('h3', { text: '노트 설정' });
    new Setting(containerEl).setName('저장 폴더').setDesc('AI 생성 노트가 저장될 폴더')
      .addText(t => t.setPlaceholder('Codex Notes').setValue(this.plugin.settings.saveFolder)
        .onChange(async v => { this.plugin.settings.saveFolder = v || 'Codex Notes'; await this.plugin.saveSettings(); }));

    new Setting(containerEl).setName('작성자 이름').setDesc('노트 프론트매터 author 필드')
      .addText(t => t.setPlaceholder('홍길동').setValue(this.plugin.settings.knotAuthor)
        .onChange(async v => { this.plugin.settings.knotAuthor = v; await this.plugin.saveSettings(); }));

    new Setting(containerEl).setName('현재 노트 컨텍스트').setDesc('열린 노트를 Codex에 자동 전달')
      .addToggle(t => t.setValue(this.plugin.settings.includeCurrentNote)
        .onChange(async v => { this.plugin.settings.includeCurrentNote = v; await this.plugin.saveSettings(); }));

    new Setting(containerEl).setName('노트 자동 저장').setDesc('"저장해줘" 등 키워드 포함 시 자동 저장')
      .addToggle(t => t.setValue(this.plugin.settings.autoSave)
        .onChange(async v => { this.plugin.settings.autoSave = v; await this.plugin.saveSettings(); }));

    containerEl.createEl('h3', { text: 'Obsidian CLI 연동 (obsidian-skill)' });
    containerEl.createEl('p', { text: 'Obsidian CLI(v1.12+) 설치 시 스마트 노트 검색·저장이 활성화됩니다.', cls: 'setting-item-description' });

    new Setting(containerEl).setName('관련 노트 최대 개수').setDesc('컨텍스트로 가져올 관련 노트 수')
      .addSlider(s => s.setLimits(1, 10, 1).setValue(this.plugin.settings.maxRelatedNotes).setDynamicTooltip()
        .onChange(async v => { this.plugin.settings.maxRelatedNotes = v; await this.plugin.saveSettings(); }));

    containerEl.createEl('h3', { text: '개발자 도구' });
    new Setting(containerEl).setName('플러그인 리로드').setDesc('Obsidian CLI로 플러그인 즉시 리로드')
      .addButton(b => b.setButtonText('🔄 리로드').onClick(async () => {
        const r = await ObsidianCLI.reloadPlugin('codex-obsidian');
        new Notice(r ? '리로드 완료!' : 'CLI를 사용할 수 없습니다.');
      }));

    new Setting(containerEl).setName('Codex 버전 확인').setDesc('설치된 Codex CLI 버전 확인')
      .addButton(b => b.setButtonText('버전 확인').onClick(async () => {
        const { available, version } = await CodexCLI.isAvailable(this.plugin.settings.codexPath);
        new Notice(available ? `Codex 버전: ${version}` : 'Codex CLI를 찾을 수 없습니다.');
      }));
  }
}

// ── 메인 플러그인 ──────────────────────────────────────────
class CodexObsidianPlugin extends Plugin {
  async onload() {
    await this.loadSettings();
    this.registerView(VIEW_TYPE, leaf => new CodexObsidianView(leaf, this));
    this.addRibbonIcon('terminal', 'Codex Obsidian 열기', () => this.activateView());

    this.addCommand({ id: 'open-codex-obsidian', name: 'Codex Obsidian 패널 열기', callback: () => this.activateView() });
    this.addCommand({
      id: 'codex-analyze', name: '현재 노트 Codex로 분석',
      editorCallback: async () => {
        await this.activateView();
        this.app.workspace.getLeavesOfType(VIEW_TYPE)[0]?.view?.quickSend('현재 열린 노트를 분석해서 핵심 내용과 개선점을 알려줘.');
      }
    });
    this.addCommand({
      id: 'codex-save-note', name: '현재 대화를 노트로 저장',
      callback: async () => {
        const v = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0]?.view;
        if (v) v.quickSend('지금까지 대화한 내용 전체를 옵시디언 노트로 저장해줘.');
        else new Notice('Codex Obsidian 패널을 먼저 열어주세요.');
      }
    });

    this.addSettingTab(new CodexObsidianSettings(this.app, this));
    this.registerEvent(this.app.workspace.on('active-leaf-change', () => {
      this.app.workspace.getLeavesOfType(VIEW_TYPE)[0]?.view?.updateContextBar();
    }));
    console.log(`Codex Obsidian v${PLUGIN_VERSION} 로드 완료`);
  }

  async activateView() {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      leaf = this.app.workspace.getRightLeaf(false);
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    this.app.workspace.revealLeaf(leaf);
  }

  async pinNote(notePath) {
    const normalized = notePath.replace(/\\/g, '/');
    if (!Array.isArray(this.settings.pinnedNotePaths)) this.settings.pinnedNotePaths = [];
    if (!this.settings.pinnedNotePaths.includes(normalized)) { this.settings.pinnedNotePaths.push(normalized); await this.saveSettings(); }
  }

  async unpinNote(notePath) {
    const normalized = notePath.replace(/\\/g, '/');
    this.settings.pinnedNotePaths = (this.settings.pinnedNotePaths || []).filter(p => p !== normalized);
    await this.saveSettings();
  }

  async loadSettings() { this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()); if (!Array.isArray(this.settings.pinnedNotePaths)) this.settings.pinnedNotePaths = []; }
  async saveSettings() { await this.saveData(this.settings); }
  onunload() { this.app.workspace.detachLeavesOfType(VIEW_TYPE); }
}

module.exports = CodexObsidianPlugin;
