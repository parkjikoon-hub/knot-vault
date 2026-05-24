/*
 * Claude Obsidian v1.3.0
 * Claude AI + Obsidian CLI(obsidian-skill) 통합 플러그인
 * 기능: 스트리밍 응답, 핀 영구 저장, 슬래시 커맨드, 작업 타임라인, 시스템 프롬프트 커스텀, 노트 컨텍스트 토글
 *       중단 메시지 보존, 재생성 버튼, 메시지 편집, 히스토리 자동 관리
 * GitHub: https://github.com/parkjikoon-hub/claude-obsidian
 */

const { Plugin, ItemView, Notice, PluginSettingTab, Setting, Modal } = require('obsidian');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const VIEW_TYPE = 'claude-obsidian-view';
const PLUGIN_VERSION = '1.3.0';

const DEFAULT_SETTINGS = {
  apiKey: '',
  model: 'claude-sonnet-4-6',
  thinkingMode: 'none',
  saveFolder: 'AI/Claude',
  autoSave: true,
  includeCurrentNote: true,
  knotAuthor: '',
  maxRelatedNotes: 3,
  maxTokens: 8192,
  pinnedNotePaths: [],
  systemPrompt: '',
  webSearch: false,
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

// ── Obsidian CLI 헬퍼 (obsidian-skill 기반) ────────────────
class ObsidianCLI {
  static async run(command) {
    try {
      const { stdout } = await execAsync(`obsidian ${command}`, { timeout: 10000 });
      return stdout.trim();
    } catch { return null; }
  }

  static async isAvailable() { return (await this.run('--version')) !== null; }

  static async searchRelated(query, limit = 3) {
    const r = await this.run(`search query="${query.slice(0, 80)}" limit=${limit} format=json`);
    if (!r) return [];
    try { return JSON.parse(r) || []; } catch { return []; }
  }

  static async readNote(name) { return await this.run(`read file="${name}"`); }

  static async createNote({ name, content, folder, author, tags, type, vaultPath }) {
    const date = new Date().toISOString().slice(0, 10);
    const authorLine = author ? `\n  - "[[${author}]]"` : '\n  - ""';
    const tagLines = (tags || ['claude-obsidian']).map(t => `  - ${t}`).join('\n');
    const front = `---\ntype: ${type || 'note'}\naliases: []\ndescription: "AI-generated note from Claude Obsidian on ${date}."\nauthor:${authorLine}\ndate created: ${date}\ndate modified: ${date}\ntags:\n${tagLines}\n---\n\n`;
    const fullContent = front + content;
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
  constructor(app, notes, onSelect) {
    super(app);
    this.notes = notes;
    this.onSelect = onSelect;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h3', { text: '📌 컨텍스트로 추가할 노트 선택' });
    contentEl.createEl('p', { text: '선택한 노트를 Claude 대화 컨텍스트에 추가합니다.', cls: 'setting-item-description' });
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
class ClaudeObsidianView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.messages = [];
    this.isLoading = false;
    this.cliAvailable = false;
    this.slashDropdownEl = null;
    this.selectedSlashIndex = 0;
  }

  getViewType() { return VIEW_TYPE; }
  getDisplayText() { return 'Claude Obsidian'; }
  getIcon() { return 'bot'; }

  async onOpen() {
    this.cliAvailable = await ObsidianCLI.isAvailable();
    this.render();
  }

  async onClose() {}

  render() {
    const root = this.containerEl.children[1];
    root.empty();
    root.addClass('claude-obsidian-container');

    // 헤더
    const header = root.createDiv('claude-obsidian-header');
    const titleRow = header.createDiv({ cls: 'claude-header-title' });
    const logoEl = titleRow.createDiv('claude-logo');
    logoEl.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="#cc785c" stroke-width="2.2" stroke-linecap="round"/>
    </svg>`;
    titleRow.createEl('span', { text: 'Claude Obsidian', cls: 'claude-title-text' });
    titleRow.createEl('span', { text: `v${PLUGIN_VERSION}`, cls: 'claude-version-badge' });
    titleRow.createEl('span', {
      text: this.cliAvailable ? '● CLI' : '○ CLI',
      cls: this.cliAvailable ? 'claude-cli-dot connected' : 'claude-cli-dot'
    });

    const controlRow = header.createDiv({ cls: 'claude-control-row' });
    const modelSelect = controlRow.createEl('select', { cls: 'claude-model-select' });
    [
      { value: 'claude-sonnet-4-6', label: 'Sonnet 4.6' },
      { value: 'claude-opus-4-6', label: 'Opus 4.6' },
      { value: 'claude-opus-4-7', label: 'Opus 4.7' },
    ].forEach(({ value, label }) => {
      const opt = modelSelect.createEl('option', { value, text: label });
      if (value === this.plugin.settings.model) opt.selected = true;
    });
    const thinkSelect = controlRow.createEl('select', { cls: 'claude-model-select' });
    [
      { value: 'none',   label: '사고: 끔' },
      { value: 'low',    label: '사고: Low' },
      { value: 'medium', label: '사고: Medium' },
      { value: 'high',   label: '사고: High' },
      { value: 'max',    label: '사고: Max' },
    ].forEach(({ value, label }) => {
      const opt = thinkSelect.createEl('option', { value, text: label });
      if (value === (this.plugin.settings.thinkingMode || 'none')) opt.selected = true;
    });
    modelSelect.onchange = async () => { this.plugin.settings.model = modelSelect.value; await this.plugin.saveSettings(); };
    thinkSelect.onchange = async () => { this.plugin.settings.thinkingMode = thinkSelect.value; await this.plugin.saveSettings(); };

    // 컨텍스트 바
    this.contextBar = root.createDiv('claude-context-bar');
    this.pinnedBar = root.createDiv('claude-pinned-bar');
    this.updateContextBar();

    // 메시지 영역
    this.messagesEl = root.createDiv('claude-messages');
    this.renderMessages();

    // 툴바
    const toolbar = root.createDiv('claude-toolbar');
    const SVGS = {
      summary: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
      search: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
      plan: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>',
      meeting: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      action: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
      save: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
      deep: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>',
      reset: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>',
    };
    [
      { svg: SVGS.summary, label: '노트 요약', fn: () => this.quickSend('현재 노트를 핵심 위주로 요약해줘.') },
      { svg: SVGS.search, label: '관련 검색', fn: () => this.searchRelatedNotes() },
      { svg: SVGS.plan, label: '기획서 변환', fn: () => this.quickSend('지금까지 대화를 체계적인 기획서 형식으로 정리해줘.') },
      { svg: SVGS.meeting, label: '회의록 작성', fn: () => this.quickSend('대화 내용을 회의록 형식으로 정리해줘.') },
      { svg: SVGS.action, label: '액션 아이템', fn: () => this.quickSend('대화에서 할 일만 체크리스트로 뽑아줘.') },
      { svg: SVGS.save, label: '노트 저장', fn: () => this.quickSend('지금까지 대화를 옵시디언 노트로 저장해줘. 마크다운 형식으로 잘 정리해서.') },
      { svg: SVGS.deep, label: '깊은 분석', fn: () => this.quickSend('현재 노트와 대화 내용을 바탕으로 깊이 있는 분석과 인사이트를 제공해줘.') },
      { svg: SVGS.reset, label: '초기화', fn: () => this.clearChat() },
    ].forEach(({ svg, label, fn }) => {
      const btn = toolbar.createEl('button', { cls: 'claude-toolbar-btn' });
      btn.createSpan().innerHTML = svg;
      btn.createEl('span', { text: label });
      btn.onclick = fn;
    });

    // 입력 영역
    const inputArea = root.createDiv('claude-input-area');
    const inputWrapper = inputArea.createDiv('claude-input-wrapper');

    // 슬래시 드롭다운
    this.slashDropdownEl = inputWrapper.createDiv({ cls: 'claude-slash-dropdown' });
    this.slashDropdownEl.style.display = 'none';

    const inputRow = inputWrapper.createDiv('claude-input-row');
    this.inputEl = inputRow.createEl('textarea', {
      cls: 'claude-input',
      attr: { placeholder: 'Claude에게 메시지를 입력하세요... (Enter 전송 / Shift+Enter 줄바꿈)\n/ 를 입력하면 커맨드 메뉴가 열립니다', rows: '1' }
    });

    // 노트 컨텍스트 토글 버튼
    this.contextToggleBtn = inputRow.createEl('button', {
      cls: 'claude-context-toggle-btn',
      attr: { title: '노트 컨텍스트 켜기/끄기' }
    });
    this.contextToggleBtn.style.cssText = 'background:none;border:none;cursor:pointer;padding:4px 6px;font-size:16px;opacity:0.7;transition:opacity 0.15s;flex-shrink:0;';
    this.updateContextToggleBtn();
    this.contextToggleBtn.onclick = async () => {
      this.plugin.settings.includeCurrentNote = !this.plugin.settings.includeCurrentNote;
      await this.plugin.saveSettings();
      this.updateContextToggleBtn();
      this.updateContextBar();
    };

    // 웹 검색 토글 버튼
    this.webSearchBtn = inputRow.createEl('button', { attr: { title: '웹 검색 켜기/끄기' } });
    this.webSearchBtn.style.cssText = 'background:none;border:none;cursor:pointer;padding:4px 6px;font-size:16px;flex-shrink:0;transition:opacity 0.15s;';
    this.updateWebSearchBtn();
    this.webSearchBtn.onclick = async () => {
      this.plugin.settings.webSearch = !this.plugin.settings.webSearch;
      await this.plugin.saveSettings();
      this.updateWebSearchBtn();
      new Notice(this.plugin.settings.webSearch ? '🌐 웹 검색 켜짐' : '🌐 웹 검색 꺼짐');
    };

    this.sendBtn = inputRow.createEl('button', { cls: 'claude-send-btn', text: '➤' });
    inputArea.createDiv({ cls: 'claude-hint', text: 'Enter: 전송  |  Shift+Enter: 줄바꿈  |  /: 커맨드  |  📄: 노트컨텍스트  |  🌐: 웹검색  |  Esc: 중단' });

    this.inputEl.addEventListener('keydown', e => {
      if (this.handleSlashKeydown(e)) return;
      if (e.key === 'Escape' && this.isLoading) {
        e.preventDefault();
        this.stopGeneration();
        return;
      }
      if (e.key === 'Enter' && (e.shiftKey || e.ctrlKey)) {
        e.preventDefault();
        const s = this.inputEl.selectionStart, end = this.inputEl.selectionEnd, v = this.inputEl.value;
        this.inputEl.value = v.slice(0, s) + '\n' + v.slice(end);
        this.inputEl.selectionStart = this.inputEl.selectionEnd = s + 1;
        this.inputEl.dispatchEvent(new Event('input'));
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
        e.preventDefault();
        this.handleSend();
      }
    });
    this.inputEl.addEventListener('input', () => {
      this.inputEl.style.height = 'auto';
      this.inputEl.style.height = Math.min(this.inputEl.scrollHeight, 120) + 'px';
      this.renderSlashCommands();
    });
    this.inputEl.addEventListener('blur', () => {
      window.setTimeout(() => this.hideSlashCommands(), 120);
    });
    this.sendBtn.onclick = () => this.handleSend();

    if (this.messages.length === 0) this.showEmpty();
  }

  // ── 슬래시 커맨드 ──────────────────────────────────────────
  getSlashQuery() {
    if (!this.inputEl) return null;
    const value = this.inputEl.value;
    const cursor = this.inputEl.selectionStart ?? value.length;
    const before = value.slice(0, cursor);
    if (!before.startsWith('/')) return null;
    if (before.includes('\n') || before.includes(' ')) return null;
    return before.toLowerCase();
  }

  getFilteredSlashCommands() {
    const q = this.getSlashQuery();
    if (q === null) return [];
    return SLASH_COMMANDS.filter(c => c.name.startsWith(q));
  }

  renderSlashCommands() {
    if (!this.slashDropdownEl) return;
    const commands = this.getFilteredSlashCommands();
    this.slashDropdownEl.empty();
    if (commands.length === 0) { this.hideSlashCommands(); return; }
    this.selectedSlashIndex = Math.min(this.selectedSlashIndex, commands.length - 1);
    this.slashDropdownEl.style.display = 'block';
    commands.forEach((cmd, i) => {
      const item = this.slashDropdownEl.createDiv({ cls: 'claude-slash-item' });
      if (i === this.selectedSlashIndex) item.addClass('selected');
      item.style.cssText = `display:flex;align-items:center;gap:8px;padding:6px 10px;cursor:pointer;border-radius:6px;${i === this.selectedSlashIndex ? 'background:var(--interactive-accent);color:var(--text-on-accent);' : ''}`;
      item.createEl('span', { text: cmd.name }).style.cssText = 'font-weight:600;font-size:13px;min-width:70px;';
      item.createEl('span', { text: cmd.hint }).style.cssText = 'font-size:12px;opacity:0.8;';
      item.addEventListener('mousedown', e => { e.preventDefault(); this.insertSlashCommand(cmd); });
    });
  }

  insertSlashCommand(cmd) {
    if (cmd.description === '__clear__') { this.clearChat(); this.inputEl.value = ''; this.hideSlashCommands(); return; }
    this.inputEl.value = '';
    this.hideSlashCommands();
    this.quickSend(cmd.description);
  }

  handleSlashKeydown(e) {
    if (this.slashDropdownEl?.style.display === 'none') return false;
    if (this.slashDropdownEl?.style.display !== 'block') return false;
    const commands = this.getFilteredSlashCommands();
    if (e.key === 'ArrowDown') { e.preventDefault(); this.selectedSlashIndex = Math.min(this.selectedSlashIndex + 1, commands.length - 1); this.renderSlashCommands(); return true; }
    if (e.key === 'ArrowUp') { e.preventDefault(); this.selectedSlashIndex = Math.max(this.selectedSlashIndex - 1, 0); this.renderSlashCommands(); return true; }
    if (e.key === 'Tab' || e.key === 'Enter') {
      const cmd = commands[this.selectedSlashIndex];
      if (cmd) { e.preventDefault(); this.insertSlashCommand(cmd); return true; }
    }
    if (e.key === 'Escape') { e.preventDefault(); this.hideSlashCommands(); return true; }
    return false;
  }

  hideSlashCommands() { if (this.slashDropdownEl) this.slashDropdownEl.style.display = 'none'; this.selectedSlashIndex = 0; }

  // ── 작업 타임라인 ──────────────────────────────────────────
  createTimeline(parent) {
    const wrap = parent.createDiv({ cls: 'claude-timeline' });
    wrap.style.cssText = 'font-size:11px;color:var(--text-muted);padding:6px 10px;border-left:2px solid var(--interactive-accent);margin-bottom:6px;';
    const list = wrap.createDiv({ cls: 'claude-timeline-list' });
    return { wrap, list };
  }

  appendTimelineStep(list, text) {
    const step = list.createDiv({ cls: 'claude-timeline-step' });
    step.style.cssText = 'padding:2px 0;';
    step.textContent = `▸ ${text}`;
    if (this.messagesEl) this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  // ── 핀 노트 관련 ───────────────────────────────────────────
  showEmpty() {
    this.messagesEl.empty();
    const el = this.messagesEl.createDiv('claude-empty');
    const logoEl = el.createDiv({ cls: 'claude-empty-logo' });
    logoEl.innerHTML = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="32" fill="#cc785c"/>
      <path d="M32 14v12M32 38v12M18.1 18.1l8.49 8.49M37.41 37.41l8.49 8.49M14 32h12M38 32h12M18.1 45.9l8.49-8.49M37.41 26.59l8.49-8.49" stroke="white" stroke-width="3.5" stroke-linecap="round"/>
    </svg>`;
    el.createEl('p', { text: 'Claude Obsidian에 오신 것을 환영합니다!', cls: 'claude-welcome-text' });
    el.createEl('p', { text: '/ 를 입력하면 커맨드 메뉴가 열립니다', cls: 'claude-welcome-hint' }).style.cssText = 'font-size:11px;color:var(--text-muted);margin-top:4px;';
  }

  updateContextToggleBtn() {
    if (!this.contextToggleBtn) return;
    const on = this.plugin.settings.includeCurrentNote;
    this.contextToggleBtn.textContent = '📄';
    this.contextToggleBtn.style.opacity = on ? '1' : '0.35';
    this.contextToggleBtn.title = on ? '노트 컨텍스트 켜짐 (클릭하면 끔)' : '노트 컨텍스트 꺼짐 (클릭하면 켬)';
  }

  updateWebSearchBtn() {
    if (!this.webSearchBtn) return;
    const on = this.plugin.settings.webSearch;
    this.webSearchBtn.textContent = '🌐';
    this.webSearchBtn.style.opacity = on ? '1' : '0.35';
    this.webSearchBtn.title = on ? '웹 검색 켜짐 (클릭하면 끔)' : '웹 검색 꺼짐 (클릭하면 켬)';
  }

  updateContextInfo() {
    if (!this.contextInfoEl) return;
    const totalChars = this.messages.reduce((sum, m) => sum + m.content.length, 0);
    this.contextInfoEl.textContent = `컨텍스트: ~${Math.round(totalChars / 4).toLocaleString()} 토큰`;
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
    const pins = this.plugin.settings.pinnedNotePaths || [];
    pins.forEach((notePath) => {
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
      new Notice(`📌 "${name}" 을 핀 추가했습니다.`);
    }).open();
  }

  // ── 메시지 렌더링 (중단 뱃지 + 재생성 + 편집 포함) ─────────
  renderMessages() {
    if (!this.messagesEl) return;
    this.messagesEl.empty();
    if (this.messages.length === 0) { this.showEmpty(); return; }

    this.messages.forEach((msg, idx) => {
      const el = this.messagesEl.createDiv(`claude-message ${msg.role}`);
      const bubbleWrap = el.createDiv({ cls: 'claude-bubble-wrap' });

      // 중단 뱃지 (aborted 메시지에만)
      if (msg.aborted) {
        const badge = bubbleWrap.createEl('span', { text: '[중단됨]', cls: 'claude-aborted-badge' });
        badge.style.cssText = 'font-size:10px;color:var(--text-muted);background:var(--background-modifier-border);padding:1px 5px;border-radius:4px;margin-right:6px;vertical-align:middle;';
      }

      const bubble = bubbleWrap.createDiv('claude-message-bubble');
      if (msg.aborted) bubble.style.opacity = '0.6';

      bubble.innerHTML = msg.content
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');

      el.createDiv({ cls: 'claude-message-time', text: msg.time || '' });

      const acts = el.createDiv('claude-message-actions');

      if (msg.role === 'assistant') {
        // 복사 버튼
        const copy = acts.createEl('button', { text: '📋 복사', cls: 'claude-msg-btn' });
        copy.onclick = () => { navigator.clipboard.writeText(msg.content); new Notice('복사됐습니다.'); };

        // 노트 저장 버튼
        const save = acts.createEl('button', { text: '💾 노트 저장', cls: 'claude-msg-btn' });
        save.onclick = () => this.saveAsNote(msg.content);

        // 재생성 버튼 (중단된 메시지 포함 모든 assistant 메시지에)
        const regen = acts.createEl('button', { text: '🔄 재생성', cls: 'claude-msg-btn' });
        regen.onclick = () => this.regenerateMessage(idx);
      }

      if (msg.role === 'user') {
        // 편집 버튼
        const edit = acts.createEl('button', { text: '✏️ 편집', cls: 'claude-msg-btn' });
        edit.onclick = () => this.editMessage(idx, msg.content);
      }
    });

    if (this.isLoading) {
      const typing = this.messagesEl.createDiv('claude-typing');
      [0,1,2].forEach(() => typing.createEl('span'));
    }
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    this.updateContextInfo();
  }

  // ── 재생성: 해당 assistant 메시지 제거 후 직전 user로 재전송 ──
  regenerateMessage(idx) {
    if (this.isLoading) return;
    // idx번 assistant 메시지 제거
    this.messages.splice(idx, 1);
    // 직전 user 메시지 찾기
    const lastUser = [...this.messages].reverse().find(m => m.role === 'user');
    if (lastUser) {
      this.sendMessage(lastUser.content, true);
    }
  }

  // ── 편집: 해당 user 메시지 이후 전체 삭제 후 입력창에 로드 ──
  editMessage(idx, content) {
    if (this.isLoading) return;
    // idx 이후 메시지 전체 삭제
    this.messages.splice(idx);
    this.renderMessages();
    // 입력창에 내용 로드
    if (this.inputEl) {
      this.inputEl.value = content;
      this.inputEl.style.height = 'auto';
      this.inputEl.style.height = Math.min(this.inputEl.scrollHeight, 120) + 'px';
      this.inputEl.focus();
    }
  }

  // ── 히스토리 길이 자동 관리 (토큰 초과 방지) ──────────────
  trimHistory() {
    const maxTokens = this.plugin.settings.maxTokens || 8192;
    const threshold = maxTokens * 0.5 * 4; // 50% 기준, 토큰→문자 변환(×4)
    const totalChars = this.messages.reduce((sum, m) => sum + m.content.length, 0);
    if (totalChars <= threshold) return;

    // user 메시지 최소 3개 유지하며 앞에서부터 제거
    let removed = 0;
    while (this.messages.length > 6) { // 최소 3쌍(user+assistant) 유지
      const chars = this.messages.reduce((sum, m) => sum + m.content.length, 0);
      if (chars <= threshold) break;
      this.messages.shift();
      removed++;
    }

    if (removed > 0) {
      // 상단에 안내 메시지 표시 (messages 배열 앞에 시스템 안내 삽입하지 않고 UI에만 표시)
      const notice = this.messagesEl?.querySelector('.claude-history-notice');
      if (!notice && this.messagesEl) {
        const n = this.messagesEl.createDiv({ cls: 'claude-history-notice' });
        n.style.cssText = 'font-size:11px;color:var(--text-muted);text-align:center;padding:6px;border-radius:6px;background:var(--background-modifier-border);margin-bottom:8px;';
        n.textContent = '이전 대화 일부가 요약됐습니다 (컨텍스트 한도 초과)';
        this.messagesEl.prepend(n);
      }
    }
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

  // isRegenerate: true면 user 메시지를 messages에 다시 추가하지 않음
  async sendMessage(userText, isRegenerate = false) {
    if (!this.plugin.settings.apiKey) { new Notice('⚠️ 설정에서 Claude API 키를 먼저 입력해주세요!'); return; }
    const now = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

    if (!isRegenerate) {
      this.messages.push({ role: 'user', content: userText, time: now });
    }

    this.isLoading = true;
    this.sendBtn.disabled = true;
    this.abortController = new AbortController();
    this.renderMessages();
    this.updateContextBar();

    // 타임라인 생성
    const timelineEl = this.messagesEl.createDiv({ cls: 'claude-message assistant' });
    const { wrap: timelineWrap, list: timelineList } = this.createTimeline(timelineEl);
    this.appendTimelineStep(timelineList, '컨텍스트 수집 중...');
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;

    // 스트리밍 응답을 표시할 버블
    let streamEl = null;
    let streamBubble = null;
    let partialReply = '';

    try {
      const context = await this.buildContext();
      this.appendTimelineStep(timelineList, 'Claude API 호출 중...');
      timelineEl.remove();

      streamEl = this.messagesEl.createDiv('claude-message assistant');
      streamBubble = streamEl.createDiv('claude-message-bubble');
      this.messagesEl.scrollTop = this.messagesEl.scrollHeight;

      const reply = await this.callClaude(userText, context, (partial) => {
        partialReply = partial;
        if (this.abortController?.signal.aborted) return;
        if (streamBubble) {
          streamBubble.innerHTML = partial
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
          this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
        }
      });

      if (streamEl) streamEl.remove();
      const t = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
      this.messages.push({ role: 'assistant', content: reply, time: t });
      if (this.plugin.settings.autoSave && this.isNoteRequest(userText)) await this.saveAsNote(reply);

    } catch (e) {
      if (timelineEl.parentNode) timelineEl.remove();
      if (streamEl && streamEl.parentNode) streamEl.remove();

      if (e.name === 'AbortError') {
        const t = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        if (partialReply && partialReply.trim()) {
          // 부분 텍스트 보존 + aborted 마킹
          this.messages.push({
            role: 'assistant',
            content: partialReply,
            aborted: true,
            time: t
          });
        } else {
          this.messages.push({ role: 'assistant', content: '⏹ 생성이 중지됐습니다.', aborted: true, time: t });
        }
      } else {
        this.messages.push({ role: 'assistant', content: `오류: ${e.message}`, time: now });
        new Notice(`Claude 오류: ${e.message}`);
      }
    } finally {
      this.isLoading = false;
      this.sendBtn.disabled = false;
      this.abortController = null;
      this.trimHistory();
      this.renderMessages();
    }
  }

  stopGeneration() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  async buildContext() {
    let ctx = '';
    if (this.plugin.settings.includeCurrentNote) {
      const file = this.app.workspace.getActiveFile();
      if (file?.extension === 'md') {
        const content = await this.app.vault.read(file);
        ctx += `\n\n[현재 노트: ${file.basename}]\n${content.slice(0, 4000)}`;
      }
    }
    const pins = this.plugin.settings.pinnedNotePaths || [];
    for (const notePath of pins) {
      const file = this.app.vault.getAbstractFileByPath(notePath);
      if (file && 'extension' in file) {
        const content = await this.app.vault.read(file);
        const name = notePath.split('/').pop()?.replace(/\.md$/i, '') || notePath;
        ctx += `\n\n[핀 노트: ${name}]\n${content.slice(0, 2000)}`;
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

  // ── API 호출: 히스토리 전달 시 aborted 메시지 필터링 ────────
  async callClaude(userMessage, context, onChunk) {
    const { apiKey, model, maxTokens, thinkingMode, systemPrompt: userSystemPrompt, webSearch } = this.plugin.settings;
    const url = 'https://api.anthropic.com/v1/messages';

    // 최적화된 기본 시스템 프롬프트
    const defaultSystem = `당신은 Obsidian 노트 전문 AI 어시스턴트입니다.

## 역할
- 사용자의 노트를 분석, 요약, 변환, 생성하는 작업을 수행합니다.
- 파일 생성 요청 시 [중단됨] 또는 불완전한 응답 내용은 포함하지 않습니다.
- 대화 맥락에서 사용자가 원하는 내용만 추려서 최적의 결과물을 만듭니다.

## 출력 형식
- Obsidian 마크다운 형식 사용 (YAML 프론트매터 포함)
- 표, 목록, 섹션 제목 적극 활용
- 한국어로 답변

## 파일 생성 원칙
- "파일 만들어줘", "노트로 저장해줘" 요청 시
  → 대화 전체에서 유효한 내용만 추려서 구조화
  → 중단된 응답, 오류 메시지, 시스템 안내는 포함하지 않음`;

    const baseSystem = (userSystemPrompt && userSystemPrompt.trim()) ? userSystemPrompt.trim() : defaultSystem;
    const systemPrompt = context ? `${baseSystem}\n\n## 컨텍스트\n${context}` : baseSystem;

    // 히스토리 구성: aborted 메시지에 명시적 안내 추가
    const history = this.messages.slice(0, -1)
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => {
        if (m.aborted) {
          return {
            role: 'assistant',
            content: m.content + '\n\n[이 응답은 사용자가 중단한 불완전한 응답입니다. 파일 생성 등 작업 시 이 내용을 포함하지 마세요.]'
          };
        }
        return { role: m.role, content: m.content };
      });

    const BUDGET_MAP = { low: 1024, medium: 8000, high: 16000, max: 32000 };
    const budgetTokens = BUDGET_MAP[thinkingMode] || 0;
    const useThinking = thinkingMode && thinkingMode !== 'none' && !model.includes('haiku');
    const effectiveMaxTokens = useThinking ? Math.max(maxTokens || 8192, budgetTokens + 1000) : (maxTokens || 8192);
    const body = { model, max_tokens: effectiveMaxTokens, system: systemPrompt, stream: true, messages: [...history, { role: 'user', content: userMessage }] };
    if (useThinking) body.thinking = { type: 'enabled', budget_tokens: budgetTokens };
    if (webSearch) body.tools = [{ type: 'web_search_20250305', name: 'web_search' }];
    const headers = { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' };
    if (webSearch) headers['anthropic-beta'] = 'web-search-2025-03-05';

    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal: this.abortController?.signal });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message || `API 오류 ${res.status}`); }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
            fullText += parsed.delta.text;
            if (onChunk) onChunk(fullText);
          }
        } catch {}
      }
    }
    return fullText || '응답을 받지 못했습니다.';
  }

  async saveAsNote(content) {
    const date = new Date().toISOString().slice(0, 10);
    const rawTitle = content.split('\n').find(l => l.trim())?.replace(/^#+\s*/, '').replace(/[<>:"\/\\|?*]/g, '').trim() || '새 노트';
    const fileName = `${date} ${rawTitle.slice(0, 50)}`;
    const { saveFolder, knotAuthor } = this.plugin.settings;
    if (this.cliAvailable) {
      const vaultPath = this.app.vault.adapter.basePath;
      const ok = await ObsidianCLI.createNote({ name: fileName, content, folder: saveFolder, author: knotAuthor, tags: ['claude-obsidian', 'ai-generated'], type: 'note', vaultPath });
      if (ok) { new Notice(`✅ 노트 저장 완료 (CLI): ${fileName}`); return; }
    }
    const frontmatter = `---\ntype: note\naliases: []\ndescription: "AI-generated note from Claude Obsidian."\nauthor:\n  - "${knotAuthor || ''}"\ndate created: ${date}\ndate modified: ${date}\ntags:\n  - claude-obsidian\n  - ai-generated\n---\n\n`;
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
class ClaudeObsidianSettings extends PluginSettingTab {
  constructor(app, plugin) { super(app, plugin); this.plugin = plugin; }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: '⚙️ Claude Obsidian 설정' });
    containerEl.createEl('h3', { text: 'Claude API' });
    const claudeLinkEl = containerEl.createEl('p', { cls: 'setting-item-description' });
    claudeLinkEl.appendText('API 키가 없으신가요? → ');
    const cl = claudeLinkEl.createEl('a', { text: 'Anthropic Console에서 발급받기 🔗', href: 'https://console.anthropic.com/settings/keys' });
    cl.style.color = 'var(--text-accent)'; cl.style.fontWeight = '600';
    new Setting(containerEl).setName('API 키').setDesc('발급받은 키를 아래에 붙여넣으세요 (sk-ant-... 로 시작)')
      .addText(t => t.setPlaceholder('sk-ant-...').setValue(this.plugin.settings.apiKey).onChange(async v => { this.plugin.settings.apiKey = v.trim(); await this.plugin.saveSettings(); }));
    new Setting(containerEl).setName('모델').setDesc('사용할 Claude 모델 선택')
      .addDropdown(d => d
        .addOption('claude-sonnet-4-6', 'Claude Sonnet 4.6 (균형·추천)')
        .addOption('claude-opus-4-6', 'Claude Opus 4.6 (고성능)')
        .addOption('claude-opus-4-7', 'Claude Opus 4.7 (최고 성능)')
        .setValue(this.plugin.settings.model)
        .onChange(async v => { this.plugin.settings.model = v; await this.plugin.saveSettings(); }));
    new Setting(containerEl).setName('최대 토큰').setDesc('응답 최대 길이 (기본 8192)')
      .addSlider(s => s.setLimits(1024, 16384, 1024).setValue(this.plugin.settings.maxTokens).setDynamicTooltip().onChange(async v => { this.plugin.settings.maxTokens = v; await this.plugin.saveSettings(); }));
    containerEl.createEl('h3', { text: '노트 설정' });
    new Setting(containerEl).setName('저장 폴더').setDesc('AI 생성 노트가 저장될 폴더 (기본: AI/Claude)')
      .addText(t => t.setPlaceholder('AI/Claude').setValue(this.plugin.settings.saveFolder).onChange(async v => { this.plugin.settings.saveFolder = v || 'AI/Claude'; await this.plugin.saveSettings(); }));
    new Setting(containerEl).setName('작성자 이름').setDesc('노트 프론트매터 author 필드 (예: 홍길동)')
      .addText(t => t.setPlaceholder('홍길동').setValue(this.plugin.settings.knotAuthor).onChange(async v => { this.plugin.settings.knotAuthor = v; await this.plugin.saveSettings(); }));
    new Setting(containerEl).setName('현재 노트 컨텍스트').setDesc('열린 노트를 Claude에 자동 전달 (대화창 📄 버튼으로도 토글 가능)')
      .addToggle(t => t.setValue(this.plugin.settings.includeCurrentNote).onChange(async v => { this.plugin.settings.includeCurrentNote = v; await this.plugin.saveSettings(); }));
    containerEl.createEl('h3', { text: '시스템 프롬프트' });
    containerEl.createEl('p', { text: '비워두면 Obsidian 노트 전문 AI 기본 프롬프트가 사용됩니다.', cls: 'setting-item-description' });
    new Setting(containerEl).setName('시스템 프롬프트').setDesc('Claude에게 전달할 역할/지시 (자유롭게 편집)')
      .addTextArea(t => {
        t.setPlaceholder('비워두면 기본값 사용').setValue(this.plugin.settings.systemPrompt || '');
        t.inputEl.rows = 6;
        t.inputEl.style.width = '100%';
        t.onChange(async v => { this.plugin.settings.systemPrompt = v; await this.plugin.saveSettings(); });
      });
    new Setting(containerEl).setName('노트 자동 저장').setDesc('"저장해줘" 등 키워드 포함 시 자동 저장')
      .addToggle(t => t.setValue(this.plugin.settings.autoSave).onChange(async v => { this.plugin.settings.autoSave = v; await this.plugin.saveSettings(); }));
    containerEl.createEl('h3', { text: 'Obsidian CLI 연동 (obsidian-skill)' });
    containerEl.createEl('p', { text: 'Obsidian CLI(v1.12+) 설치 시 스마트 노트 검색·저장이 활성화됩니다.', cls: 'setting-item-description' });
    new Setting(containerEl).setName('관련 노트 최대 개수').setDesc('컨텍스트로 가져올 관련 노트 수')
      .addSlider(s => s.setLimits(1, 10, 1).setValue(this.plugin.settings.maxRelatedNotes).setDynamicTooltip().onChange(async v => { this.plugin.settings.maxRelatedNotes = v; await this.plugin.saveSettings(); }));
    containerEl.createEl('h3', { text: '개발자 도구' });
    new Setting(containerEl).setName('플러그인 리로드').setDesc('Obsidian CLI로 플러그인 즉시 리로드')
      .addButton(b => b.setButtonText('🔄 리로드').onClick(async () => {
        const r = await ObsidianCLI.reloadPlugin('claude-obsidian');
        new Notice(r ? '리로드 완료!' : 'CLI를 사용할 수 없습니다.');
      }));
    new Setting(containerEl).setName('에러 확인').setDesc('플러그인 콘솔 에러 확인')
      .addButton(b => b.setButtonText('🐛 에러 확인').onClick(async () => {
        const r = await ObsidianCLI.getErrors();
        new Notice(r || '에러 없음');
      }));
  }
}

// ── 메인 플러그인 ──────────────────────────────────────────
class ClaudeObsidianPlugin extends Plugin {
  async onload() {
    await this.loadSettings();
    this.registerView(VIEW_TYPE, leaf => new ClaudeObsidianView(leaf, this));
    this.addRibbonIcon('bot', 'Claude Obsidian 열기', () => this.activateView());
    this.addCommand({ id: 'open-claude-obsidian', name: 'Claude Obsidian 패널 열기', callback: () => this.activateView() });
    this.addCommand({
      id: 'claude-summarize', name: '현재 노트 Claude로 요약',
      editorCallback: async () => {
        await this.activateView();
        this.app.workspace.getLeavesOfType(VIEW_TYPE)[0]?.view?.quickSend('현재 열려있는 노트를 핵심 내용 위주로 요약해줘.');
      }
    });
    this.addCommand({
      id: 'claude-analyze', name: '현재 노트 Claude로 깊이 분석',
      editorCallback: async () => {
        await this.activateView();
        this.app.workspace.getLeavesOfType(VIEW_TYPE)[0]?.view?.quickSend('현재 노트를 깊이 있게 분석하고 핵심 인사이트와 개선점을 알려줘.');
      }
    });
    this.addCommand({
      id: 'claude-save-note', name: '현재 대화를 노트로 저장',
      callback: async () => {
        const v = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0]?.view;
        if (v) v.quickSend('지금까지 대화한 내용 전체를 옵시디언 노트로 저장해줘.');
        else new Notice('Claude Obsidian 패널을 먼저 열어주세요.');
      }
    });
    this.addSettingTab(new ClaudeObsidianSettings(this.app, this));
    this.registerEvent(this.app.workspace.on('active-leaf-change', () => {
      this.app.workspace.getLeavesOfType(VIEW_TYPE)[0]?.view?.updateContextBar();
    }));
    console.log(`Claude Obsidian v${PLUGIN_VERSION} 로드 완료`);
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
    if (!this.settings.pinnedNotePaths.includes(normalized)) {
      this.settings.pinnedNotePaths.push(normalized);
      await this.saveSettings();
    }
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

module.exports = ClaudeObsidianPlugin;
