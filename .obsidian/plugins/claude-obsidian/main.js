/*
 * Claude Obsidian v1.0.0
 * Claude AI + Obsidian CLI(obsidian-skill) 통합 플러그인
 * gemini-obsidian, codex-obsidian과 동일한 구조
 * GitHub: https://github.com/parkjikoon-hub/claude-obsidian
 */

const { Plugin, ItemView, Notice, PluginSettingTab, Setting, Modal } = require('obsidian');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const VIEW_TYPE = 'claude-obsidian-view';
const PLUGIN_VERSION = '1.0.0';

const DEFAULT_SETTINGS = {
  apiKey: '',
  model: 'claude-sonnet-4-5',
  saveFolder: 'AI/Claude',
  autoSave: true,
  includeCurrentNote: true,
  knotAuthor: '',
  maxRelatedNotes: 3,
  maxTokens: 8192,
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
    const tagLines = (tags || ['claude-obsidian']).map(t => `  - ${t}`).join('\n');
    const front = `---\ntype: ${type || 'note'}\naliases: []\ndescription: "AI-generated note from Claude Obsidian on ${date}."\nauthor:${authorLine}\ndate created: ${date}\ndate modified: ${date}\ntags:\n${tagLines}\n---\n\n`;
    const escaped = (front + content).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
    const p = folder ? `${folder}/${name}.md` : `${name}.md`;
    return (await this.run(`create name="${name}" path="${p}" content="${escaped}" silent overwrite`)) !== null;
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
    this.pinnedNotes = [];
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
    titleRow.createDiv('claude-logo');
    titleRow.createEl('span', { text: 'Claude Obsidian' });
    titleRow.createEl('span', { text: `v${PLUGIN_VERSION}`, cls: 'claude-version-badge' });

    const cliStatus = header.createDiv('claude-cli-status');
    cliStatus.createEl('span', {
      text: this.cliAvailable ? '● Obsidian CLI 연결됨' : '○ 기본 모드',
      cls: this.cliAvailable ? 'cli-connected' : 'cli-disconnected'
    });

    // 컨텍스트 바
    this.contextBar = root.createDiv('claude-context-bar');
    this.pinnedBar = root.createDiv('claude-pinned-bar');
    this.updateContextBar();

    // 메시지 영역
    this.messagesEl = root.createDiv('claude-messages');
    this.renderMessages();

    // 툴바
    const toolbar = root.createDiv('claude-toolbar');
    [
      { icon: '📄', label: '현재 노트 요약', fn: () => this.quickSend('현재 노트를 핵심 위주로 요약해줘.') },
      { icon: '🔍', label: '관련 노트 검색', fn: () => this.searchRelatedNotes() },
      { icon: '📋', label: '기획서 변환', fn: () => this.quickSend('지금까지 대화를 체계적인 기획서 형식으로 정리해줘.') },
      { icon: '📝', label: '회의록 작성', fn: () => this.quickSend('대화 내용을 회의록 형식으로 정리해줘.') },
      { icon: '🧠', label: '깊은 분석', fn: () => this.quickSend('현재 노트와 대화 내용을 바탕으로 깊이 있는 분석과 인사이트를 제공해줘.') },
      { icon: '✅', label: '액션 아이템', fn: () => this.quickSend('대화에서 할 일만 체크리스트로 뽑아줘.') },
      { icon: '💾', label: '노트 저장', fn: () => this.quickSend('지금까지 대화를 옵시디언 노트로 저장해줘. 마크다운 형식으로 잘 정리해서.') },
      { icon: '🔄', label: '초기화', fn: () => this.clearChat() },
    ].forEach(({ icon, label, fn }) => {
      const btn = toolbar.createEl('button', { cls: 'claude-toolbar-btn' });
      btn.createEl('span', { text: icon + ' ' + label });
      btn.onclick = fn;
    });

    // 입력 영역
    const inputArea = root.createDiv('claude-input-area');
    const inputRow = inputArea.createDiv('claude-input-row');
    this.inputEl = inputRow.createEl('textarea', {
      cls: 'claude-input',
      attr: { placeholder: 'Claude에게 메시지를 입력하세요... (Shift+Enter 전송)', rows: '1' }
    });
    this.sendBtn = inputRow.createEl('button', { cls: 'claude-send-btn', text: '➤' });
    inputArea.createDiv({ cls: 'claude-hint', text: 'Enter: 줄바꿈  |  Shift+Enter: 전송' });

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
    const el = this.messagesEl.createDiv('claude-empty');
    el.createDiv({ cls: 'claude-empty-icon', text: '🤖' });
    el.createEl('p', { text: 'Claude Obsidian에 오신 것을 환영합니다!' });
    if (!this.plugin.settings.apiKey) {
      const w = el.createEl('p', { text: '⚠️ 설정에서 Claude API 키를 먼저 입력해주세요.' });
      w.style.color = 'var(--color-orange)';
      const hint = el.createEl('p', { text: 'API 키 발급: console.anthropic.com' });
      hint.style.fontSize = '12px';
      hint.style.color = 'var(--text-muted)';
    }
    el.createEl('p', {
      text: this.cliAvailable
        ? '✅ Obsidian CLI 연결됨 — 스마트 노트 검색·저장 사용 가능'
        : '💡 Obsidian CLI 설치 시 스마트 노트 검색·저장 기능이 활성화됩니다.'
    });
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
      const el = this.messagesEl.createDiv(`claude-message ${msg.role}`);
      const bubble = el.createDiv('claude-message-bubble');
      bubble.innerHTML = msg.content
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
      el.createDiv({ cls: 'claude-message-time', text: msg.time || '' });

      if (msg.role === 'assistant') {
        const acts = el.createDiv('claude-message-actions');
        const copy = acts.createEl('button', { text: '📋 복사', cls: 'claude-msg-btn' });
        copy.onclick = () => { navigator.clipboard.writeText(msg.content); new Notice('복사됐습니다.'); };
        const save = acts.createEl('button', { text: '💾 노트 저장', cls: 'claude-msg-btn' });
        save.onclick = () => this.saveAsNote(msg.content);
      }
    });

    if (this.isLoading) {
      const typing = this.messagesEl.createDiv('claude-typing');
      [0,1,2].forEach(() => typing.createEl('span'));
    }
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
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
    if (!this.plugin.settings.apiKey) {
      new Notice('⚠️ 설정에서 Claude API 키를 먼저 입력해주세요!');
      return;
    }
    const now = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    this.messages.push({ role: 'user', content: userText, time: now });
    this.isLoading = true;
    this.sendBtn.disabled = true;
    this.renderMessages();
    this.updateContextBar();

    try {
      const context = await this.buildContext();
      const reply = await this.callClaude(userText, context);
      const t = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
      this.messages.push({ role: 'assistant', content: reply, time: t });
      if (this.plugin.settings.autoSave && this.isNoteRequest(userText)) {
        await this.saveAsNote(reply);
      }
    } catch (e) {
      this.messages.push({ role: 'assistant', content: `오류: ${e.message}`, time: now });
      new Notice(`Claude 오류: ${e.message}`);
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
        ctx += `\n\n[현재 노트: ${file.basename}]\n${content.slice(0, 4000)}`;
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

  async callClaude(userMessage, context) {
    const { apiKey, model, maxTokens } = this.plugin.settings;
    const url = 'https://api.anthropic.com/v1/messages';

    const systemPrompt = `당신은 Obsidian 노트 작성을 도와주는 AI 어시스턴트입니다.
기획서, 회의록, 분석 문서 등을 옵시디언 마크다운 형식으로 작성합니다.
노트를 저장할 때는 반드시 YAML 프론트매터를 포함하세요.${context ? `\n\n${context}` : ''}`;

    const history = this.messages.slice(0, -1).map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content
    }));

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [...history, { role: 'user', content: userMessage }]
      })
    });

    if (!res.ok) {
      const e = await res.json();
      throw new Error(e.error?.message || `API 오류 ${res.status}`);
    }
    const data = await res.json();
    return data.content?.[0]?.text || '응답을 받지 못했습니다.';
  }

  async saveAsNote(content) {
    const date = new Date().toISOString().slice(0, 10);
    const rawTitle = content.split('\n').find(l => l.trim())?.replace(/^#+\s*/, '').replace(/[<>:"\/\\|?*]/g, '').trim() || '새 노트';
    const fileName = `${date} ${rawTitle.slice(0, 50)}`;
    const { saveFolder, knotAuthor } = this.plugin.settings;

    if (this.cliAvailable) {
      const ok = await ObsidianCLI.createNote({
        name: fileName, content, folder: saveFolder,
        author: knotAuthor, tags: ['claude-obsidian', 'ai-generated'], type: 'note'
      });
      if (ok) { new Notice(`✅ 노트 저장 완료 (CLI): ${fileName}`); return; }
    }

    const frontmatter = `---\ntype: note\naliases: []\ndescription: "AI-generated note from Claude Obsidian."\nauthor:\n  - "${knotAuthor || ''}"\ndate created: ${date}\ndate modified: ${date}\ntags:\n  - claude-obsidian\n  - ai-generated\n---\n\n`;
    try {
      if (!this.app.vault.getAbstractFileByPath(saveFolder)) {
        await this.app.vault.createFolder(saveFolder);
      }
      const p = `${saveFolder}/${fileName}.md`;
      await this.app.vault.create(p, frontmatter + content);
      new Notice(`✅ 노트 저장 완료: ${fileName}`);
      const file = this.app.vault.getAbstractFileByPath(p);
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
class ClaudeObsidianSettings extends PluginSettingTab {
  constructor(app, plugin) { super(app, plugin); this.plugin = plugin; }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: '⚙️ Claude Obsidian 설정' });

    containerEl.createEl('h3', { text: 'Claude API' });
    containerEl.createEl('p', {
      text: 'API 키 발급: console.anthropic.com → API Keys → Create Key',
      cls: 'setting-item-description'
    });

    new Setting(containerEl).setName('API 키').setDesc('Anthropic Console에서 발급한 API 키 (sk-ant-... 로 시작)')
      .addText(t => t.setPlaceholder('sk-ant-...').setValue(this.plugin.settings.apiKey)
        .onChange(async v => { this.plugin.settings.apiKey = v.trim(); await this.plugin.saveSettings(); }));

    new Setting(containerEl).setName('모델').setDesc('사용할 Claude 모델 선택')
      .addDropdown(d => d
        .addOption('claude-haiku-4-5-20251001', 'Claude Haiku (빠름·저렴)')
        .addOption('claude-sonnet-4-5', 'Claude Sonnet (균형·추천)')
        .addOption('claude-opus-4-7', 'Claude Opus (최고 성능)')
        .setValue(this.plugin.settings.model)
        .onChange(async v => { this.plugin.settings.model = v; await this.plugin.saveSettings(); }));

    new Setting(containerEl).setName('최대 토큰').setDesc('응답 최대 길이 (기본 8192)')
      .addSlider(s => s.setLimits(1024, 16384, 1024).setValue(this.plugin.settings.maxTokens).setDynamicTooltip()
        .onChange(async v => { this.plugin.settings.maxTokens = v; await this.plugin.saveSettings(); }));

    containerEl.createEl('h3', { text: '노트 설정' });
    new Setting(containerEl).setName('저장 폴더').setDesc('AI 생성 노트가 저장될 폴더 (기본: AI/Claude)')
      .addText(t => t.setPlaceholder('AI/Claude').setValue(this.plugin.settings.saveFolder)
        .onChange(async v => { this.plugin.settings.saveFolder = v || 'AI/Claude'; await this.plugin.saveSettings(); }));

    new Setting(containerEl).setName('작성자 이름').setDesc('노트 프론트매터 author 필드 (예: 홍길동)')
      .addText(t => t.setPlaceholder('홍길동').setValue(this.plugin.settings.knotAuthor)
        .onChange(async v => { this.plugin.settings.knotAuthor = v; await this.plugin.saveSettings(); }));

    new Setting(containerEl).setName('현재 노트 컨텍스트').setDesc('열린 노트를 Claude에 자동 전달')
      .addToggle(t => t.setValue(this.plugin.settings.includeCurrentNote)
        .onChange(async v => { this.plugin.settings.includeCurrentNote = v; await this.plugin.saveSettings(); }));

    new Setting(containerEl).setName('노트 자동 저장').setDesc('"저장해줘" 등 키워드 포함 시 자동 저장')
      .addToggle(t => t.setValue(this.plugin.settings.autoSave)
        .onChange(async v => { this.plugin.settings.autoSave = v; await this.plugin.saveSettings(); }));

    containerEl.createEl('h3', { text: 'Obsidian CLI 연동 (obsidian-skill)' });
    containerEl.createEl('p', {
      text: 'Obsidian CLI(v1.12+) 설치 시 스마트 노트 검색·저장이 활성화됩니다.',
      cls: 'setting-item-description'
    });

    new Setting(containerEl).setName('관련 노트 최대 개수').setDesc('컨텍스트로 가져올 관련 노트 수')
      .addSlider(s => s.setLimits(1, 10, 1).setValue(this.plugin.settings.maxRelatedNotes).setDynamicTooltip()
        .onChange(async v => { this.plugin.settings.maxRelatedNotes = v; await this.plugin.saveSettings(); }));

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

  async loadSettings() { this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()); }
  async saveSettings() { await this.saveData(this.settings); }
  onunload() { this.app.workspace.detachLeavesOfType(VIEW_TYPE); }
}

module.exports = ClaudeObsidianPlugin;
