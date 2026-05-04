/*
 * Gemini Obsidian v1.1.0
 * Gemini AI + Obsidian CLI(obsidian-skill) 통합 플러그인
 * GitHub: https://github.com/knot-hub/gemini-obsidian
 */

const { Plugin, ItemView, Notice, PluginSettingTab, Setting, Modal } = require('obsidian');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const VIEW_TYPE = 'gemini-obsidian-view';
const PLUGIN_VERSION = '1.1.0';

const DEFAULT_SETTINGS = {
  apiKey: '',
  model: 'gemini-1.5-flash',
  saveFolder: 'Gemini Notes',
  autoSave: true,
  includeCurrentNote: true,
  obsidianCliEnabled: true,
  knotAuthor: '',
  maxRelatedNotes: 3,
};

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
    const result = await this.run(`search query="${query.slice(0, 80)}" limit=${limit} format=json`);
    if (!result) return [];
    try { return JSON.parse(result) || []; } catch { return []; }
  }

  static async readNote(name) {
    return await this.run(`read file="${name}"`);
  }

  // obsidian-skill 방식으로 KNOT 프론트매터 포함 노트 생성
  static async createNote({ name, content, folder, author, tags, type }) {
    const date = new Date().toISOString().slice(0, 10);
    const authorLine = author ? `\n  - "[[${author}]]"` : '\n  - ""';
    const tagLines = (tags || ['gemini-obsidian']).map(t => `  - ${t}`).join('\n');

    const frontmatter = `---
type: ${type || 'note'}
aliases: []
description: "AI-generated note from Gemini Obsidian conversation on ${date}."
author:${authorLine}
date created: ${date}
date modified: ${date}
tags:
${tagLines}
---

`;
    const fullContent = frontmatter + content;
    const path = folder ? `${folder}/${name}.md` : `${name}.md`;
    const escaped = fullContent.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
    return (await this.run(`create name="${name}" path="${path}" content="${escaped}" silent overwrite`)) !== null;
  }

  static async reloadPlugin(id) {
    return await this.run(`plugin:reload id=${id}`);
  }

  static async getErrors() {
    return await this.run('dev:errors');
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
    this.pinnedNotes = [];
  }

  getViewType() { return VIEW_TYPE; }
  getDisplayText() { return 'Gemini Obsidian'; }
  getIcon() { return 'sparkles'; }

  async onOpen() {
    this.cliAvailable = await ObsidianCLI.isAvailable();
    this.render();
  }

  async onClose() {}

  render() {
    const root = this.containerEl.children[1];
    root.empty();
    root.addClass('gemini-obsidian-container');

    // 헤더
    const header = root.createDiv('gemini-obsidian-header');
    const titleRow = header.createDiv({ cls: 'gemini-header-title' });
    titleRow.createDiv('gemini-logo');
    titleRow.createEl('span', { text: 'Gemini Obsidian' });
    titleRow.createEl('span', { text: `v${PLUGIN_VERSION}`, cls: 'gemini-version-badge' });

    // 모델 선택 드롭다운
    const modelSelect = titleRow.createEl('select', { cls: 'gemini-model-select' });
    [
      { value: 'gemini-1.5-flash', label: 'Flash' },
      { value: 'gemini-1.5-pro', label: 'Pro' },
      { value: 'gemini-2.0-flash', label: 'Flash2' },
      { value: 'gemini-2.5-pro', label: 'Pro2.5' },
    ].forEach(({ value, label }) => {
      const opt = modelSelect.createEl('option', { value, text: label });
      if (value === this.plugin.settings.model) opt.selected = true;
    });
    modelSelect.onchange = async () => {
      this.plugin.settings.model = modelSelect.value;
      await this.plugin.saveSettings();
      this.updateContextInfo();
    };

    // 컨텍스트 토큰 표시
    this.contextInfoEl = titleRow.createEl('span', { cls: 'gemini-context-info' });
    this.updateContextInfo();

    const cliStatus = header.createDiv('gemini-cli-status');
    cliStatus.createEl('span', {
      text: this.cliAvailable ? '● Obsidian CLI 연결됨' : '○ 기본 모드',
      cls: this.cliAvailable ? 'cli-connected' : 'cli-disconnected'
    });

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
      summary: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
      search: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
      plan: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>',
      meeting: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      action: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
      save: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
      reset: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>',
    };
    [
      { svg: SVGS.summary, label: '현재 노트 요약', fn: () => this.quickSend('현재 노트를 핵심 위주로 요약해줘.') },
      { svg: SVGS.search, label: '관련 노트 검색', fn: () => this.searchRelatedNotes() },
      { svg: SVGS.plan, label: '기획서 변환', fn: () => this.quickSend('지금까지 대화를 체계적인 기획서 형식으로 정리해줘.') },
      { svg: SVGS.meeting, label: '회의록 작성', fn: () => this.quickSend('대화 내용을 회의록 형식으로 정리해줘.') },
      { svg: SVGS.action, label: '액션 아이템', fn: () => this.quickSend('대화에서 할 일만 체크리스트로 뽑아줘.') },
      { svg: SVGS.save, label: '노트 저장', fn: () => this.quickSend('지금까지 대화를 옵시디언 노트로 저장해줘. 마크다운 형식으로 잘 정리해서.') },
      { svg: SVGS.reset, label: '초기화', fn: () => this.clearChat() },
    ].forEach(({ svg, label, fn }) => {
      const btn = toolbar.createEl('button', { cls: 'gemini-toolbar-btn' });
      const iconEl = btn.createSpan();
      iconEl.innerHTML = svg;
      btn.createEl('span', { text: label });
      btn.onclick = fn;
    });

    // 입력 영역
    const inputArea = root.createDiv('gemini-input-area');
    const inputRow = inputArea.createDiv('gemini-input-row');
    this.inputEl = inputRow.createEl('textarea', {
      cls: 'gemini-input',
      attr: { placeholder: 'Gemini에게 메시지를 입력하세요... (Shift+Enter 전송)', rows: '1' }
    });
    this.sendBtn = inputRow.createEl('button', { cls: 'gemini-send-btn', text: '➤' });
    inputArea.createDiv({ cls: 'gemini-hint', text: 'Enter: 줄바꿈  |  Shift+Enter: 전송' });

    this.inputEl.addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.shiftKey) { e.preventDefault(); this.handleSend(); }
    });
    this.sendBtn.onclick = () => this.handleSend();
    this.inputEl.addEventListener('input', () => {
      this.inputEl.style.height = 'auto';
      this.inputEl.style.height = Math.min(this.inputEl.scrollHeight, 120) + 'px';
    });

    if (this.messages.length === 0) this.showEmpty();
  }

  showEmpty() {
    this.messagesEl.empty();
    const el = this.messagesEl.createDiv('gemini-empty');
    const logoEl = el.createDiv({ cls: 'gemini-empty-logo' });
    logoEl.innerHTML = '<svg width="64" height="64" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#4285f4"/><stop offset="100%" style="stop-color:#34a853"/></linearGradient></defs><circle cx="32" cy="32" r="32" fill="url(#g)"/><text x="32" y="42" text-anchor="middle" font-size="28" fill="white">G</text></svg>';
    el.createEl('p', { text: 'Gemini Obsidian에 오신 것을 환영합니다!', cls: 'gemini-welcome-text' });
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
    this.pinnedNotes.forEach((n, i) => {
      const tag = this.pinnedBar.createDiv('pinned-note-tag');
      tag.createEl('span', { text: '📌 ' + n });
      const rm = tag.createEl('button', { text: '×', cls: 'pinned-remove' });
      rm.onclick = () => { this.pinnedNotes.splice(i, 1); this.updateContextBar(); };
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

    new RelatedNotesModal(this.app, results, name => {
      if (!this.pinnedNotes.includes(name)) {
        this.pinnedNotes.push(name);
        this.updateContextBar();
        new Notice(`📌 "${name}" 을 컨텍스트에 추가했습니다.`);
      }
    }).open();
  }

  renderMessages() {
    if (!this.messagesEl) return;
    this.messagesEl.empty();
    if (this.messages.length === 0) { this.showEmpty(); return; }

    this.messages.forEach(msg => {
      const el = this.messagesEl.createDiv(`gemini-message ${msg.role}`);
      const bubble = el.createDiv('gemini-message-bubble');
      bubble.innerHTML = msg.content
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
      el.createDiv({ cls: 'gemini-message-time', text: msg.time || '' });

      if (msg.role === 'assistant') {
        const acts = el.createDiv('gemini-message-actions');
        const copy = acts.createEl('button', { text: '📋 복사', cls: 'gemini-msg-btn' });
        copy.onclick = () => { navigator.clipboard.writeText(msg.content); new Notice('복사됐습니다.'); };
        const save = acts.createEl('button', { text: '💾 노트 저장', cls: 'gemini-msg-btn' });
        save.onclick = () => this.saveAsNote(msg.content);
      }
    });

    if (this.isLoading) {
      const typing = this.messagesEl.createDiv('gemini-typing');
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
    await this.sendMessage(text);
  }

  quickSend(text) { this.sendMessage(text); }

  async sendMessage(userText) {
    if (!this.plugin.settings.apiKey) { new Notice('⚠️ 설정에서 Gemini API 키를 먼저 입력해주세요!'); return; }
    const now = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    this.messages.push({ role: 'user', content: userText, time: now });
    this.isLoading = true;
    this.sendBtn.disabled = true;
    this.renderMessages();
    this.updateContextBar();

    try {
      const context = await this.buildContext();
      const reply = await this.callGemini(userText, context);
      const t = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
      this.messages.push({ role: 'assistant', content: reply, time: t });
      if (this.plugin.settings.autoSave && this.isNoteRequest(userText)) {
        await this.saveAsNote(reply);
      }
    } catch (e) {
      this.messages.push({ role: 'assistant', content: `오류: ${e.message}`, time: now });
      new Notice(`Gemini 오류: ${e.message}`);
    } finally {
      this.isLoading = false;
      this.sendBtn.disabled = false;
      this.renderMessages();
    }
  }

  async buildContext() {
    let ctx = '';
    if (this.plugin.settings.includeCurrentNote) {
      const file = this.app.workspace.getActiveFile();
      if (file?.extension === 'md') {
        const content = await this.app.vault.read(file);
        ctx += `\n\n[현재 노트: ${file.basename}]\n${content.slice(0, 3000)}`;
      }
    }
    if (this.cliAvailable && this.pinnedNotes.length) {
      for (const name of this.pinnedNotes) {
        const content = await ObsidianCLI.readNote(name);
        if (content) ctx += `\n\n[관련 노트: ${name}]\n${content.slice(0, 2000)}`;
      }
    }
    return ctx;
  }

  isNoteRequest(text) {
    return ['노트로 저장', '저장해줘', '파일로 만들어', '문서로 만들어', '기획서로', '회의록으로', '정리해서 저장'].some(k => text.includes(k));
  }

  async callGemini(userMessage, context) {
    const { apiKey, model } = this.plugin.settings;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const history = this.messages.slice(0, -1).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));
    const systemPrompt = `당신은 Obsidian 노트 작성을 도와주는 AI 어시스턴트입니다. 기획서, 회의록 등을 옵시디언 마크다운 형식으로 작성합니다.${context ? `\n\n${context}` : ''}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [...history, { role: 'user', parts: [{ text: userMessage }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 8192 }
      })
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message || `API 오류 ${res.status}`); }
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '응답을 받지 못했습니다.';
  }

  async saveAsNote(content) {
    const date = new Date().toISOString().slice(0, 10);
    const rawTitle = content.split('\n').find(l => l.trim())?.replace(/^#+\s*/, '').replace(/[<>:"\/\\|?*]/g, '').trim() || '새 노트';
    const fileName = `${date} ${rawTitle.slice(0, 50)}`;
    const { saveFolder, knotAuthor } = this.plugin.settings;

    if (this.cliAvailable) {
      const ok = await ObsidianCLI.createNote({
        name: fileName, content, folder: saveFolder,
        author: knotAuthor, tags: ['gemini-obsidian', 'ai-generated'], type: 'note'
      });
      if (ok) { new Notice(`✅ 노트 저장 완료 (CLI): ${fileName}`); return; }
    }

    // Vault API 폴백
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

  clearChat() {
    this.messages = [];
    this.pinnedNotes = [];
    this.renderMessages();
    new Notice('대화가 초기화됐습니다.');
  }
}

// ── 설정 탭 ────────────────────────────────────────────────
class GeminiObsidianSettings extends PluginSettingTab {
  constructor(app, plugin) { super(app, plugin); this.plugin = plugin; }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: '⚙️ Gemini Obsidian 설정' });

    containerEl.createEl('h3', { text: 'Gemini API' });

    // API 키 발급 링크
    const geminiLinkEl = containerEl.createEl('p', { cls: 'setting-item-description' });
    geminiLinkEl.appendText('API 키가 없으신가요? → ');
    const geminiLink = geminiLinkEl.createEl('a', { text: 'Google AI Studio에서 무료 발급받기 🔗', href: 'https://aistudio.google.com/apikey' });
    geminiLink.style.color = 'var(--text-accent)';
    geminiLink.style.fontWeight = '600';

    new Setting(containerEl).setName('API 키').setDesc('발급받은 키를 아래에 붙여넣으세요 (AIza... 로 시작)')
      .addText(t => t.setPlaceholder('AIza...').setValue(this.plugin.settings.apiKey)
        .onChange(async v => { this.plugin.settings.apiKey = v.trim(); await this.plugin.saveSettings(); }));

    new Setting(containerEl).setName('모델').setDesc('사용할 Gemini 모델 선택')
      .addDropdown(d => d
        .addOption('gemini-1.5-flash', 'Gemini 1.5 Flash (빠름·무료)')
        .addOption('gemini-1.5-pro', 'Gemini 1.5 Pro (강력)')
        .addOption('gemini-2.0-flash', 'Gemini 2.0 Flash (최신)')
        .addOption('gemini-2.5-pro', 'Gemini 2.5 Pro (최고)')
        .setValue(this.plugin.settings.model)
        .onChange(async v => { this.plugin.settings.model = v; await this.plugin.saveSettings(); }));

    containerEl.createEl('h3', { text: '노트 설정' });
    new Setting(containerEl).setName('저장 폴더').setDesc('AI 생성 노트가 저장될 폴더')
      .addText(t => t.setPlaceholder('Gemini Notes').setValue(this.plugin.settings.saveFolder)
        .onChange(async v => { this.plugin.settings.saveFolder = v || 'Gemini Notes'; await this.plugin.saveSettings(); }));

    new Setting(containerEl).setName('작성자 이름').setDesc('노트 프론트매터 author 필드 (예: 홍길동)')
      .addText(t => t.setPlaceholder('홍길동').setValue(this.plugin.settings.knotAuthor)
        .onChange(async v => { this.plugin.settings.knotAuthor = v; await this.plugin.saveSettings(); }));

    new Setting(containerEl).setName('현재 노트 컨텍스트').setDesc('열린 노트를 Gemini에 자동 전달')
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
    new Setting(containerEl).setName('플러그인 리로드').setDesc('Obsidian CLI로 플러그인을 즉시 리로드')
      .addButton(b => b.setButtonText('🔄 리로드').onClick(async () => {
        const r = await ObsidianCLI.reloadPlugin('gemini-obsidian');
        new Notice(r ? '리로드 완료!' : 'CLI를 사용할 수 없습니다.');
      }));

    new Setting(containerEl).setName('에러 확인').setDesc('플러그인 콘솔 에러를 확인합니다')
      .addButton(b => b.setButtonText('🐛 에러 확인').onClick(async () => {
        const r = await ObsidianCLI.getErrors();
        new Notice(r || '에러 없음');
      }));
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
      editorCallback: async () => {
        await this.activateView();
        this.app.workspace.getLeavesOfType(VIEW_TYPE)[0]?.view?.quickSend('현재 열려있는 노트를 핵심 내용 위주로 요약해줘.');
      }
    });
    this.addCommand({
      id: 'gemini-save-note', name: '현재 대화를 노트로 저장',
      callback: async () => {
        const v = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0]?.view;
        if (v) v.quickSend('지금까지 대화한 내용 전체를 옵시디언 노트로 저장해줘.');
        else new Notice('Gemini Obsidian 패널을 먼저 열어주세요.');
      }
    });

    this.addSettingTab(new GeminiObsidianSettings(this.app, this));
    this.registerEvent(this.app.workspace.on('active-leaf-change', () => {
      this.app.workspace.getLeavesOfType(VIEW_TYPE)[0]?.view?.updateContextBar();
    }));
    console.log(`Gemini Obsidian v${PLUGIN_VERSION} 로드 완료`);
  }

  async activateView() {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      leaf = this.app.workspace.getRightLeaf(false);
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    this.app.workspace.revealLeaf(leaf);
  }

  async loadSettings() { this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()); }
  async saveSettings() { await this.saveData(this.settings); }
  onunload() { this.app.workspace.detachLeavesOfType(VIEW_TYPE); }
}

module.exports = GeminiObsidianPlugin;
