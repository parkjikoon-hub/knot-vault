/*
 * Gemini Obsidian v1.2.0
 * Gemini AI + Obsidian CLI(obsidian-skill) 통합 플러그인
 * 기능: Memory Map, 핀 영구 저장, 슬래시 커맨드, 작업 타임라인
 * GitHub: https://github.com/parkjikoon-hub/gemini-obsidian
 */

const { Plugin, ItemView, Notice, PluginSettingTab, Setting, Modal } = require('obsidian');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const VIEW_TYPE = 'gemini-obsidian-view';
const PLUGIN_VERSION = '1.2.0';

const DEFAULT_SETTINGS = {
  apiKey: '',
  model: 'gemini-3-flash-preview',
  thinkingMode: 'none',
  maxTokens: 8192,
  saveFolder: 'AI/Gemini',
  autoSave: true,
  includeCurrentNote: true,
  obsidianCliEnabled: true,
  knotAuthor: '',
  maxRelatedNotes: 3,
  pinnedNotePaths: [],
};

// 슬래시 커맨드 목록
const SLASH_COMMANDS = [
  { name: '/요약', hint: '노트 요약', description: '현재 노트를 핵심 위주로 요약해줘.' },
  { name: '/분석', hint: '깊은 분석', description: '현재 노트와 대화를 깊이 있게 분석하고 인사이트를 제공해줘.' },
  { name: '/기획서', hint: '기획서 변환', description: '지금까지 대화를 체계적인 기획서 형식으로 정리해줘.' },
  { name: '/회의록', hint: '회의록 작성', description: '대화 내용을 회의록 형식으로 정리해줘.' },
  { name: '/액션', hint: '액션 아이템', description: '대화에서 할 일만 체크리스트로 뽑아줘.' },
  { name: '/저장', hint: '노트 저장', description: '지금까지 대화를 옵시디언 노트로 저장해줘. 마크다운 형식으로 잘 정리해서.' },
  { name: '/번역', hint: '한영 번역', description: '현재 노트 내용을 영어로 번역해줘. 원문도 함께 유지해줘.' },
  { name: '/초기화', hint: '대화 초기화', description: '__clear__' },
];

// ── Memory Map 서비스 ─────────────────────────────────────────
const STOP_WORDS = new Set([
  '그리고', '그러나', '이것', '저것', '하는', '있는', '없는', 'the', 'and', 'for', 'with', 'that', 'this',
  'from', 'into', 'about', 'note', 'notes', '정리', '내용', '문서', '관련', '키워드', '자료', '수업', '교육',
  'https', 'http', 'www', 'com', 'net', 'org', 'html', 'utm', 'amp', 'nbsp', 'pdf', 'jpg', 'png', 'md',
  '그리고', '또는', '하지만', '때문에', '위해서', '통해서', '대해서', '입니다', '합니다', '있는지', '있습니다',
]);
const NOISY_TERM = /^(?:https?|www|com|net|org|html?|utm|ref|amp|nbsp|localhost|\d+|[a-f0-9]{8,})$/i;
const MEMORY_INDEX_PATH = '.gemini-obsidian/memory/index.json';

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
      this.index = parsed;
      return parsed;
    } catch { return null; }
  }

  async getStatus() {
    const index = await this.load();
    return { built: Boolean(index), count: index?.entries.length || 0, builtAt: index?.builtAt || null };
  }

  async findRelated(currentFile, limit = 8) {
    const index = await this.load() || await this.build();
    const current = index.entries.find(e => e.path === currentFile.path);
    if (!current) return [];
    const stats = this.createCorpusStats(index.entries);
    return index.entries.filter(e => e.path !== current.path).map(e => this.score(current, e, stats)).filter(r => r.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);
  }

  async persist(index) {
    const adapter = this.app.vault.adapter;
    if (!await adapter.exists('.gemini-obsidian')) await adapter.mkdir('.gemini-obsidian');
    if (!await adapter.exists('.gemini-obsidian/memory')) await adapter.mkdir('.gemini-obsidian/memory');
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

  tokenize(content) {
    return content.replace(/```[\s\S]*?```/g, ' ').replace(/https?:\/\/\S+/gi, ' ').replace(/---[\s\S]*?---/, ' ').replace(/[^\p{L}\p{N}_-]+/gu, ' ').split(/\s+/).map(w => this.normalizeTerm(w)).filter(Boolean);
  }

  normalizeTerm(word) {
    const n = word.trim().toLowerCase().replace(/^[-_]+|[-_]+$/g, '');
    if (n.length < 2 || n.length > 40) return '';
    if (STOP_WORDS.has(n) || NOISY_TERM.test(n)) return '';
    if (/^\d+(?:[-_]\d+)*$/.test(n)) return '';
    return n;
  }

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
    const ageDays = Math.max(0, (Date.now() - candidate.mtime) / 86400000);
    if (ageDays < 14) { score += 1; reasons.push('최근 수정됨'); }
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
      const bm25 = idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (cLen / stats.avgLength))));
      matches.push({ term, score: bm25 * Math.min(Math.sqrt(ct[term]), 4) });
    }
    matches.sort((a, b) => b.score - a.score);
    return { score: Math.min(matches.reduce((s, m) => s + m.score, 0), 12), terms: matches.slice(0, 6).map(m => m.term) };
  }
}

// ── Obsidian CLI 헬퍼 ────────────────────────────────────────
class ObsidianCLI {
  static async run(command) {
    try { const { stdout } = await execAsync(`obsidian ${command}`, { timeout: 10000 }); return stdout.trim(); }
    catch { return null; }
  }
  static async isAvailable() { return (await this.run('--version')) !== null; }
  static async searchRelated(query, limit = 3) {
    const result = await this.run(`search query="${query.slice(0, 80)}" limit=${limit} format=json`);
    if (!result) return [];
    try { return JSON.parse(result) || []; } catch { return []; }
  }
  static async readNote(name) { return await this.run(`read file="${name}"`); }
  static async createNote({ name, content, folder, author, tags, type, vaultPath }) {
    const date = new Date().toISOString().slice(0, 10);
    const authorLine = author ? `\n  - "[[${author}]]"` : '\n  - ""';
    const tagLines = (tags || ['gemini-obsidian']).map(t => `  - ${t}`).join('\n');
    const frontmatter = `---\ntype: ${type || 'note'}\naliases: []\ndescription: "AI-generated note from Gemini Obsidian conversation on ${date}."\nauthor:${authorLine}\ndate created: ${date}\ndate modified: ${date}\ntags:\n${tagLines}\n---\n\n`;
    const fullContent = frontmatter + content;
    const p = folder ? `${folder}/${name}.md` : `${name}.md`;
    if (vaultPath) {
      const fs = require('fs');
      const path = require('path');
      const absPath = path.join(vaultPath, p);
      const dir = path.dirname(absPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(absPath, fullContent, 'utf8');
      await this.run(`open path="${p}" newtab`);
      return true;
    }
    const escaped = fullContent.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
    return (await this.run(`create path="${p}" content="${escaped}" overwrite`)) !== null;
  }
  static async reloadPlugin(id) { return await this.run(`plugin:reload id=${id}`); }
  static async getErrors() { return await this.run('dev:errors'); }
}

// ── 관련 노트 선택 모달 ────────────────────────────────────
class RelatedNotesModal extends Modal {
  constructor(app, notes, onSelect) { super(app); this.notes = notes; this.onSelect = onSelect; }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h3', { text: '📌 컨텍스트로 추가할 노트 선택' });
    contentEl.createEl('p', { text: '선택한 노트를 Gemini 대화 컨텍스트에 추가합니다.', cls: 'setting-item-description' });
    this.notes.forEach(note => {
      const name = note.name || note.file || String(note);
      const row = contentEl.createDiv();
      row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:8px;cursor:pointer;margin-bottom:6px;background:var(--background-secondary);transition:background 0.15s;';
      row.createEl('span', { text: '📄 ' + name });
      row.onmouseenter = () => row.style.background = 'var(--background-modifier-hover)';
      row.onmouseleave = () => row.style.background = 'var(--background-secondary)';
      row.onclick = () => { this.onSelect(name); this.close(); };
    });
    contentEl.createEl('button', { text: '닫기' }).onclick = () => this.close();
  }
  onClose() { this.contentEl.empty(); }
}

// ── 채팅 사이드바 뷰 ──────────────────────────────────────
class GeminiObsidianView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.messages = [];
    this.isLoading = false;
    this.cliAvailable = false;
    this.memoryMap = new MemoryMapService(plugin.app);
    this.relatedNotes = [];
    this.isMemoryMapExpanded = true;
    this.slashDropdownEl = null;
    this.selectedSlashIndex = 0;
  }

  getViewType() { return VIEW_TYPE; }
  getDisplayText() { return 'Gemini Obsidian'; }
  getIcon() { return 'sparkles'; }

  async onOpen() { this.cliAvailable = await ObsidianCLI.isAvailable(); this.render(); }
  async onClose() {}

  render() {
    const root = this.containerEl.children[1];
    root.empty();
    root.addClass('gemini-obsidian-container');

    // 헤더
    const header = root.createDiv('gemini-obsidian-header');
    const titleRow = header.createDiv({ cls: 'gemini-header-title' });
    const logoEl = titleRow.createDiv('gemini-logo');
    logoEl.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="url(#gemini-grad)"/>
      <defs><linearGradient id="gemini-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#4285f4"/><stop offset="50%" stop-color="#9c27b0"/><stop offset="100%" stop-color="#ea4335"/>
      </linearGradient></defs>
    </svg>`;
    titleRow.createEl('span', { text: 'Gemini Obsidian', cls: 'gemini-title-text' });
    titleRow.createEl('span', { text: `v${PLUGIN_VERSION}`, cls: 'gemini-version-badge' });
    titleRow.createEl('span', { text: this.cliAvailable ? '● CLI' : '○ CLI', cls: this.cliAvailable ? 'gemini-cli-dot connected' : 'gemini-cli-dot' });

    const controlRow = header.createDiv({ cls: 'gemini-control-row' });
    const modelSelect = controlRow.createEl('select', { cls: 'gemini-model-select' });
    [
      { value: 'gemini-3.1-flash-lite-preview', label: '3.1 Flash Lite' },
      { value: 'gemini-3-flash-preview',        label: '3.1 Flash' },
      { value: 'gemini-3.1-pro-preview',        label: '3.1 Pro' },
    ].forEach(({ value, label }) => {
      const opt = modelSelect.createEl('option', { value, text: label });
      if (value === this.plugin.settings.model) opt.selected = true;
    });
    const thinkSelect = controlRow.createEl('select', { cls: 'gemini-model-select' });
    [
      { value: 'none', label: '사고: 끔' },
      { value: 'low', label: '사고: Low' },
      { value: 'medium', label: '사고: Medium' },
      { value: 'high', label: '사고: High' },
    ].forEach(({ value, label }) => {
      const opt = thinkSelect.createEl('option', { value, text: label });
      if (value === (this.plugin.settings.thinkingMode || 'none')) opt.selected = true;
    });
    modelSelect.onchange = async () => { this.plugin.settings.model = modelSelect.value; await this.plugin.saveSettings(); };
    thinkSelect.onchange = async () => { this.plugin.settings.thinkingMode = thinkSelect.value; await this.plugin.saveSettings(); };

    // Memory Map 패널
    this.memoryMapEl = root.createDiv('gemini-memory-map-panel');
    this.renderMemoryMapPanel();

    // 컨텍스트 바
    this.contextBar = root.createDiv('gemini-context-bar');
    this.pinnedBar = root.createDiv('gemini-pinned-bar');
    this.updateContextBar();

    // 메시지 영역
    this.messagesEl = root.createDiv('gemini-messages');
    this.renderMessages();

    // 툴바
    const toolbar = root.createDiv('gemini-toolbar');
    const SVGS = {
      summary: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
      search: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
      plan: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>',
      meeting: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      action: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
      save: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
      translate: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/></svg>',
      reset: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>',
    };
    [
      { svg: SVGS.summary, label: '노트 요약', fn: () => this.quickSend('현재 노트를 핵심 위주로 요약해줘.') },
      { svg: SVGS.search, label: '관련 검색', fn: () => this.searchRelatedNotes() },
      { svg: SVGS.plan, label: '기획서 변환', fn: () => this.quickSend('지금까지 대화를 체계적인 기획서 형식으로 정리해줘.') },
      { svg: SVGS.meeting, label: '회의록 작성', fn: () => this.quickSend('대화 내용을 회의록 형식으로 정리해줘.') },
      { svg: SVGS.action, label: '액션 아이템', fn: () => this.quickSend('대화에서 할 일만 체크리스트로 뽑아줘.') },
      { svg: SVGS.save, label: '노트 저장', fn: () => this.quickSend('지금까지 대화를 옵시디언 노트로 저장해줘. 마크다운 형식으로 잘 정리해서.') },
      { svg: SVGS.translate, label: '번역·다국어', fn: () => this.quickSend('현재 노트 내용을 영어로 번역해줘. 원문도 함께 유지해줘.') },
      { svg: SVGS.reset, label: '초기화', fn: () => this.clearChat() },
    ].forEach(({ svg, label, fn }) => {
      const btn = toolbar.createEl('button', { cls: 'gemini-toolbar-btn' });
      btn.createSpan().innerHTML = svg;
      btn.createEl('span', { text: label });
      btn.onclick = fn;
    });

    // 입력 영역
    const inputArea = root.createDiv('gemini-input-area');
    const inputWrapper = inputArea.createDiv('gemini-input-wrapper');
    this.slashDropdownEl = inputWrapper.createDiv({ cls: 'gemini-slash-dropdown' });
    this.slashDropdownEl.style.display = 'none';
    const inputRow = inputWrapper.createDiv('gemini-input-row');
    this.inputEl = inputRow.createEl('textarea', {
      cls: 'gemini-input',
      attr: { placeholder: 'Gemini에게 메시지를 입력하세요... (Enter 전송 / Shift+Enter 줄바꿈)\n/ 를 입력하면 커맨드 메뉴가 열립니다', rows: '1' }
    });
    this.sendBtn = inputRow.createEl('button', { cls: 'gemini-send-btn', text: '➤' });
    inputArea.createDiv({ cls: 'gemini-hint', text: 'Enter: 전송  |  Shift+Enter: 줄바꿈  |  /: 커맨드 메뉴' });

    this.inputEl.addEventListener('keydown', e => {
      if (this.handleSlashKeydown(e)) return;
      if (e.key === 'Enter' && (e.shiftKey || e.ctrlKey)) {
        e.preventDefault();
        const s = this.inputEl.selectionStart, end = this.inputEl.selectionEnd, v = this.inputEl.value;
        this.inputEl.value = v.slice(0, s) + '\n' + v.slice(end);
        this.inputEl.selectionStart = this.inputEl.selectionEnd = s + 1;
        this.inputEl.dispatchEvent(new Event('input'));
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) { e.preventDefault(); this.handleSend(); }
    });
    this.inputEl.addEventListener('input', () => {
      this.inputEl.style.height = 'auto';
      this.inputEl.style.height = Math.min(this.inputEl.scrollHeight, 120) + 'px';
      this.renderSlashCommands();
    });
    this.inputEl.addEventListener('blur', () => { window.setTimeout(() => this.hideSlashCommands(), 120); });
    this.sendBtn.onclick = () => this.handleSend();

    if (this.messages.length === 0) this.showEmpty();

    this.registerEvent(this.app.workspace.on('file-open', () => { this.relatedNotes = []; this.renderMemoryMapPanel(); }));
  }

  // ── Memory Map ─────────────────────────────────────────────
  async renderMemoryMapPanel() {
    if (!this.memoryMapEl) return;
    this.memoryMapEl.empty();
    const status = await this.memoryMap.getStatus();
    this.memoryMapEl.toggleClass('is-collapsed', !this.isMemoryMapExpanded);
    const header = this.memoryMapEl.createDiv({ cls: 'gemini-memory-map-header' });

    const toggleBtn = header.createSpan({ cls: 'gemini-memory-map-toggle' });
    toggleBtn.textContent = this.isMemoryMapExpanded ? '▼' : '▶';
    toggleBtn.onclick = async () => { this.isMemoryMapExpanded = !this.isMemoryMapExpanded; await this.renderMemoryMapPanel(); };

    const titleSpan = header.createSpan({ cls: 'gemini-memory-map-title' });
    titleSpan.textContent = `🗺️ ${status.built ? `Memory Map · ${status.count}개 노트` : 'Memory Map (미구축)'}`;
    titleSpan.onclick = async () => { this.isMemoryMapExpanded = !this.isMemoryMapExpanded; await this.renderMemoryMapPanel(); };

    if (this.relatedNotes.length > 0) {
      const clearBtn = header.createEl('button', { cls: 'gemini-memory-btn', text: '지우기' });
      clearBtn.onclick = async () => { this.relatedNotes = []; await this.renderMemoryMapPanel(); };
    }
    const buildBtn = header.createEl('button', { cls: 'gemini-memory-btn', text: status.built ? '재구축' : '구축하기' });
    buildBtn.onclick = async () => { buildBtn.textContent = '구축 중...'; await this.memoryMap.build(); await this.renderMemoryMapPanel(); new Notice('Memory Map 구축 완료!'); };
    const findBtn = header.createEl('button', { cls: 'gemini-memory-btn', text: '관련 노트 찾기' });
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
      const hint = this.memoryMapEl.createDiv({ cls: 'gemini-memory-hint' });
      hint.style.cssText = 'font-size:11px;color:var(--text-muted);padding:6px 10px;';
      hint.textContent = status.built ? '노트를 열고 "관련 노트 찾기"를 눌러보세요.' : '"구축하기"를 눌러 Memory Map을 만드세요.';
      return;
    }
    const list = this.memoryMapEl.createDiv({ cls: 'gemini-memory-results' });
    for (const result of this.relatedNotes) {
      const chip = list.createDiv({ cls: 'gemini-memory-chip' });
      chip.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:4px 8px;border-radius:6px;background:var(--background-secondary);margin-bottom:3px;cursor:pointer;font-size:12px;';
      const info = chip.createDiv(); info.style.cssText = 'flex:1;min-width:0;';
      info.createEl('span', { text: result.title }).style.cssText = 'font-weight:600;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
      if (result.reasons[0]) info.createEl('span', { text: result.reasons[0] }).style.cssText = 'font-size:10px;color:var(--text-muted);';
      const addBtn = chip.createEl('button', { text: '📌', attr: { title: '핀 추가' } });
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
      const item = this.slashDropdownEl.createDiv({ cls: 'gemini-slash-item' });
      if (i === this.selectedSlashIndex) item.addClass('selected');
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

  // ── 작업 타임라인 ──────────────────────────────────────────
  createTimeline(parent) {
    const wrap = parent.createDiv({ cls: 'gemini-timeline' });
    wrap.style.cssText = 'font-size:11px;color:var(--text-muted);padding:6px 10px;border-left:2px solid #4285f4;margin-bottom:6px;';
    const list = wrap.createDiv();
    return { wrap, list };
  }
  appendTimelineStep(list, text) {
    const step = list.createDiv();
    step.style.cssText = 'padding:2px 0;';
    step.textContent = `▸ ${text}`;
    if (this.messagesEl) this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  showEmpty() {
    this.messagesEl.empty();
    const el = this.messagesEl.createDiv('gemini-empty');
    const logoEl = el.createDiv({ cls: 'gemini-empty-logo' });
    logoEl.innerHTML = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="32" fill="#1a1a2e"/>
      <path d="M32 8L37 27L56 32L37 37L32 56L27 37L8 32L27 27L32 8Z" fill="url(#gemini-lg)"/>
      <defs><linearGradient id="gemini-lg" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#4285f4"/><stop offset="33%" stop-color="#9c27b0"/><stop offset="66%" stop-color="#ea4335"/><stop offset="100%" stop-color="#fbbc05"/>
      </linearGradient></defs>
    </svg>`;
    el.createEl('p', { text: 'Gemini Obsidian에 오신 것을 환영합니다!', cls: 'gemini-welcome-text' });
    el.createEl('p', { text: '/ 를 입력하면 커맨드 메뉴가 열립니다' }).style.cssText = 'font-size:11px;color:var(--text-muted);margin-top:4px;';
  }

  updateContextInfo() {
    if (!this.contextInfoEl) return;
    this.contextInfoEl.textContent = `컨텍스트: ~${Math.round(this.messages.reduce((s, m) => s + m.content.length, 0) / 4).toLocaleString()} 토큰`;
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
      const el = this.messagesEl.createDiv(`gemini-message ${msg.role}`);
      const bubble = el.createDiv('gemini-message-bubble');
      bubble.innerHTML = msg.content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/`(.*?)`/g, '<code>$1</code>').replace(/\n/g, '<br>');
      el.createDiv({ cls: 'gemini-message-time', text: msg.time || '' });
      if (msg.role === 'assistant') {
        const acts = el.createDiv('gemini-message-actions');
        const copy = acts.createEl('button', { text: '📋 복사', cls: 'gemini-msg-btn' });
        copy.onclick = () => { navigator.clipboard.writeText(msg.content); new Notice('복사됐습니다.'); };
        const save = acts.createEl('button', { text: '💾 노트 저장', cls: 'gemini-msg-btn' });
        save.onclick = () => this.saveAsNote(msg.content);
      }
    });
    if (this.isLoading) { const typing = this.messagesEl.createDiv('gemini-typing'); [0,1,2].forEach(() => typing.createEl('span')); }
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    this.updateContextInfo();
  }

  async handleSend() {
    const text = this.inputEl.value.trim();
    if (!text || this.isLoading) return;
    this.inputEl.value = ''; this.inputEl.style.height = 'auto'; this.hideSlashCommands();
    await this.sendMessage(text);
  }

  quickSend(text) { this.sendMessage(text); }

  async sendMessage(userText) {
    if (!this.plugin.settings.apiKey) { new Notice('⚠️ 설정에서 Gemini API 키를 먼저 입력해주세요!'); return; }
    const now = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    this.messages.push({ role: 'user', content: userText, time: now });
    this.isLoading = true; this.sendBtn.disabled = true;
    this.renderMessages(); this.updateContextBar();

    const timelineEl = this.messagesEl.createDiv({ cls: 'gemini-message assistant' });
    const { wrap: timelineWrap, list: timelineList } = this.createTimeline(timelineEl);
    this.appendTimelineStep(timelineList, '컨텍스트 수집 중...');
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;

    try {
      const context = await this.buildContext();
      this.appendTimelineStep(timelineList, 'Gemini API 호출 중...');
      const reply = await this.callGemini(userText, context);
      this.appendTimelineStep(timelineList, '응답 완료');
      timelineEl.remove();
      const t = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
      this.messages.push({ role: 'assistant', content: reply, time: t });
      if (this.plugin.settings.autoSave && this.isNoteRequest(userText)) await this.saveAsNote(reply);
    } catch (e) {
      timelineEl.remove();
      this.messages.push({ role: 'assistant', content: `오류: ${e.message}`, time: now });
      new Notice(`Gemini 오류: ${e.message}`);
    } finally {
      this.isLoading = false; this.sendBtn.disabled = false; this.renderMessages();
    }
  }

  async buildContext() {
    let ctx = '';
    if (this.plugin.settings.includeCurrentNote) {
      const file = this.app.workspace.getActiveFile();
      if (file?.extension === 'md') { const content = await this.app.vault.read(file); ctx += `\n\n[현재 노트: ${file.basename}]\n${content.slice(0, 3000)}`; }
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

  isNoteRequest(text) { return ['노트로 저장', '저장해줘', '파일로 만들어', '문서로 만들어', '기획서로', '회의록으로', '정리해서 저장'].some(k => text.includes(k)); }

  async callGemini(userMessage, context) {
    const { apiKey, model, maxTokens, thinkingMode } = this.plugin.settings;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const history = this.messages.slice(0, -1).map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] }));
    const systemPrompt = `당신은 Obsidian 노트 전문 AI 어시스턴트입니다.\n## 핵심 원칙\n- 노트 분석 시 **핵심 개념, 구조, 통찰, 개선점**을 구체적이고 상세하게 제공합니다.\n- 기획서, 회의록 등은 옵시디언 마크다운 형식으로 작성합니다.\n- 노트 저장 시 반드시 YAML 프론트매터를 포함하세요.\n- 한국어로 답변합니다.${context ? `\n\n## 컨텍스트\n${context}` : ''}`;
    const BUDGET_MAP = { none: 0, low: 1024, medium: 8192, high: 24576 };
    const thinkingBudget = BUDGET_MAP[thinkingMode || 'none'];
    const generationConfig = { temperature: thinkingMode && thinkingMode !== 'none' ? 1.0 : 0.7, maxOutputTokens: 16384 };
    if (thinkingBudget > 0) generationConfig.thinkingConfig = { thinkingBudget };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system_instruction: { parts: [{ text: systemPrompt }] }, contents: [...history, { role: 'user', parts: [{ text: userMessage }] }], generationConfig })
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message || `API 오류 ${res.status}`); }
    const data = await res.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const textPart = parts.find(p => p.text && !p.thought);
    return textPart?.text || parts[0]?.text || '응답을 받지 못했습니다.';
  }

  async saveAsNote(content) {
    const date = new Date().toISOString().slice(0, 10);
    const rawTitle = content.split('\n').find(l => l.trim())?.replace(/^#+\s*/, '').replace(/[<>:"\/\\|?*]/g, '').trim() || '새 노트';
    const fileName = `${date} ${rawTitle.slice(0, 50)}`;
    const { saveFolder, knotAuthor } = this.plugin.settings;
    if (this.cliAvailable) {
      const vaultPath = this.app.vault.adapter.basePath;
      const ok = await ObsidianCLI.createNote({ name: fileName, content, folder: saveFolder, author: knotAuthor, tags: ['gemini-obsidian', 'ai-generated'], type: 'note', vaultPath });
      if (ok) { new Notice(`✅ 노트 저장 완료 (CLI): ${fileName}`); return; }
    }
    const frontmatter = `---\ntype: note\naliases: []\ndescription: "AI-generated note from Gemini Obsidian."\nauthor:\n  - "${knotAuthor || ''}"\ndate created: ${date}\ndate modified: ${date}\ntags:\n  - gemini-obsidian\n  - ai-generated\n---\n\n`;
    try {
      if (!this.app.vault.getAbstractFileByPath(saveFolder)) await this.app.vault.createFolder(saveFolder);
      const path = `${saveFolder}/${fileName}.md`;
      await this.app.vault.create(path, frontmatter + content);
      new Notice(`✅ 노트 저장 완료: ${fileName}`);
      const file = this.app.vault.getAbstractFileByPath(path);
      if (file) await this.app.workspace.getLeaf('tab').openFile(file);
    } catch (e) { new Notice(`노트 저장 실패: ${e.message}`); }
  }

  clearChat() { this.messages = []; this.renderMessages(); new Notice('대화가 초기화됐습니다.'); }
}

// ── 설정 탭 ────────────────────────────────────────────────
class GeminiObsidianSettings extends PluginSettingTab {
  constructor(app, plugin) { super(app, plugin); this.plugin = plugin; }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: '⚙️ Gemini Obsidian 설정' });
    containerEl.createEl('h3', { text: 'Gemini API' });
    const gl = containerEl.createEl('p', { cls: 'setting-item-description' });
    gl.appendText('API 키가 없으신가요? → ');
    const glink = gl.createEl('a', { text: 'Google AI Studio에서 무료 발급받기 🔗', href: 'https://aistudio.google.com/apikey' });
    glink.style.color = 'var(--text-accent)'; glink.style.fontWeight = '600';
    new Setting(containerEl).setName('API 키').setDesc('발급받은 키를 아래에 붙여넣으세요 (AIza... 로 시작)')
      .addText(t => t.setPlaceholder('AIza...').setValue(this.plugin.settings.apiKey).onChange(async v => { this.plugin.settings.apiKey = v.trim(); await this.plugin.saveSettings(); }));
    new Setting(containerEl).setName('모델').setDesc('사용할 Gemini 모델 선택')
      .addDropdown(d => d.addOption('gemini-3.1-flash-lite-preview', 'Gemini 3.1 Flash Lite (빠름·경량)').addOption('gemini-3-flash-preview', 'Gemini 3.1 Flash (균형·추천)').addOption('gemini-3.1-pro-preview', 'Gemini 3.1 Pro (최고 성능)').setValue(this.plugin.settings.model).onChange(async v => { this.plugin.settings.model = v; await this.plugin.saveSettings(); }));
    containerEl.createEl('h3', { text: '노트 설정' });
    new Setting(containerEl).setName('저장 폴더').addText(t => t.setPlaceholder('AI/Gemini').setValue(this.plugin.settings.saveFolder).onChange(async v => { this.plugin.settings.saveFolder = v || 'AI/Gemini'; await this.plugin.saveSettings(); }));
    new Setting(containerEl).setName('작성자 이름').addText(t => t.setPlaceholder('홍길동').setValue(this.plugin.settings.knotAuthor).onChange(async v => { this.plugin.settings.knotAuthor = v; await this.plugin.saveSettings(); }));
    new Setting(containerEl).setName('현재 노트 컨텍스트').addToggle(t => t.setValue(this.plugin.settings.includeCurrentNote).onChange(async v => { this.plugin.settings.includeCurrentNote = v; await this.plugin.saveSettings(); }));
    new Setting(containerEl).setName('노트 자동 저장').addToggle(t => t.setValue(this.plugin.settings.autoSave).onChange(async v => { this.plugin.settings.autoSave = v; await this.plugin.saveSettings(); }));
    containerEl.createEl('h3', { text: 'Obsidian CLI 연동 (obsidian-skill)' });
    new Setting(containerEl).setName('관련 노트 최대 개수').addSlider(s => s.setLimits(1, 10, 1).setValue(this.plugin.settings.maxRelatedNotes).setDynamicTooltip().onChange(async v => { this.plugin.settings.maxRelatedNotes = v; await this.plugin.saveSettings(); }));
    containerEl.createEl('h3', { text: '개발자 도구' });
    new Setting(containerEl).setName('플러그인 리로드').addButton(b => b.setButtonText('🔄 리로드').onClick(async () => { const r = await ObsidianCLI.reloadPlugin('gemini-obsidian'); new Notice(r ? '리로드 완료!' : 'CLI를 사용할 수 없습니다.'); }));
    new Setting(containerEl).setName('에러 확인').addButton(b => b.setButtonText('🐛 에러 확인').onClick(async () => { const r = await ObsidianCLI.getErrors(); new Notice(r || '에러 없음'); }));
  }
}

// ── 메인 플러그인 ──────────────────────────────────────────
class GeminiObsidianPlugin extends Plugin {
  async onload() {
    await this.loadSettings();
    this.registerView(VIEW_TYPE, leaf => new GeminiObsidianView(leaf, this));
    this.addRibbonIcon('sparkles', 'Gemini Obsidian 열기', () => this.activateView());
    this.addCommand({ id: 'open-gemini-obsidian', name: 'Gemini Obsidian 패널 열기', callback: () => this.activateView() });
    this.addCommand({
      id: 'gemini-summarize', name: '현재 노트 Gemini로 요약',
      editorCallback: async () => { await this.activateView(); this.app.workspace.getLeavesOfType(VIEW_TYPE)[0]?.view?.quickSend('현재 열려있는 노트를 핵심 내용 위주로 요약해줘.'); }
    });
    this.addCommand({
      id: 'gemini-save-note', name: '현재 대화를 노트로 저장',
      callback: async () => { const v = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0]?.view; if (v) v.quickSend('지금까지 대화한 내용 전체를 옵시디언 노트로 저장해줘.'); else new Notice('Gemini Obsidian 패널을 먼저 열어주세요.'); }
    });
    this.addSettingTab(new GeminiObsidianSettings(this.app, this));
    this.registerEvent(this.app.workspace.on('active-leaf-change', () => { this.app.workspace.getLeavesOfType(VIEW_TYPE)[0]?.view?.updateContextBar(); }));
    console.log(`Gemini Obsidian v${PLUGIN_VERSION} 로드 완료`);
  }

  async activateView() {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) { leaf = this.app.workspace.getRightLeaf(false); await leaf.setViewState({ type: VIEW_TYPE, active: true }); }
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

module.exports = GeminiObsidianPlugin;
