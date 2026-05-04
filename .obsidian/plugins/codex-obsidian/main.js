/*
 * Codex Obsidian v1.0.0
 * OpenAI Codex CLI + Obsidian CLI(obsidian-skill) 통합 플러그인
 * codexian 오픈소스 기반으로 더 강력하게 재구성
 * GitHub: https://github.com/knot-hub/codex-obsidian
 */

const { Plugin, ItemView, Notice, PluginSettingTab, Setting, Modal } = require('obsidian');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const execAsync = promisify(exec);

const VIEW_TYPE = 'codex-obsidian-view';
const PLUGIN_VERSION = '1.0.0';

const DEFAULT_SETTINGS = {
  codexPath: 'codex',
  model: 'gpt-4o',
  approvalMode: 'suggest',
  saveFolder: 'Codex Notes',
  autoSave: true,
  includeCurrentNote: true,
  obsidianCliEnabled: true,
  knotAuthor: '',
  maxRelatedNotes: 3,
  maxTokens: 8000,
};

const APPROVAL_MODES = {
  suggest: '제안 모드 (명령 실행 전 확인)',
  auto: '자동 모드 (안전한 명령 자동 실행)',
  full: '전체 자동 모드 (모든 명령 자동 실행)',
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
      const { stdout } = await execAsync(`${codexPath} --version`, { timeout: 5000 });
      return { available: true, version: stdout.trim() };
    } catch {
      return { available: false, version: null };
    }
  }

  // Codex CLI를 스트리밍으로 실행
  static runStreaming({ codexPath, prompt, model, approvalMode, cwd, onData, onEnd, onError }) {
    const args = [prompt, '--model', model, '--approval-mode', approvalMode, '--no-interactive'];
    const proc = spawn(codexPath, args, {
      cwd: cwd || process.env.HOME || process.env.USERPROFILE,
      env: { ...process.env },
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
    this.pinnedNotes = [];
    this.currentProcess = null;
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
    const titleRow = header.createDiv('codex-header-title');
    titleRow.createDiv('codex-logo');
    titleRow.createEl('span', { text: 'Codex Obsidian' });
    titleRow.createEl('span', { text: `v${PLUGIN_VERSION}`, cls: 'codex-version-badge' });

    // 상태 표시
    const statusBar = header.createDiv('codex-status-bar');
    statusBar.createEl('span', {
      text: this.codexAvailable ? `● Codex ${this.codexVersion}` : '✗ Codex CLI 없음',
      cls: this.codexAvailable ? 'status-ok' : 'status-err'
    });
    statusBar.createEl('span', { text: ' | ' });
    statusBar.createEl('span', {
      text: this.cliAvailable ? '● Obsidian CLI' : '○ Obsidian CLI 없음',
      cls: this.cliAvailable ? 'status-ok' : 'status-warn'
    });
    statusBar.createEl('span', { text: ' | ' });
    statusBar.createEl('span', { text: `모드: ${this.plugin.settings.approvalMode}`, cls: 'status-mode' });

    // 컨텍스트 바
    this.contextBar = root.createDiv('codex-context-bar');
    this.pinnedBar = root.createDiv('codex-pinned-bar');
    this.updateContextBar();

    // 메시지 영역
    this.messagesEl = root.createDiv('codex-messages');
    this.renderMessages();

    // 툴바
    const toolbar = root.createDiv('codex-toolbar');
    [
      { icon: '📄', label: '현재 노트 분석', fn: () => this.quickSend('현재 열린 노트를 분석해서 핵심 내용과 개선점을 알려줘.') },
      { icon: '🔍', label: '관련 노트 검색', fn: () => this.searchRelatedNotes() },
      { icon: '💻', label: '코드 생성', fn: () => this.quickSend('현재 노트 내용을 바탕으로 필요한 코드나 스크립트를 생성해줘.') },
      { icon: '📋', label: '기획서 변환', fn: () => this.quickSend('지금까지 대화를 체계적인 기획서 형식으로 정리해줘.') },
      { icon: '📝', label: '회의록 작성', fn: () => this.quickSend('대화 내용을 회의록 형식으로 정리해줘.') },
      { icon: '💾', label: '노트 저장', fn: () => this.quickSend('지금까지 대화를 옵시디언 노트로 저장해줘. 마크다운 형식으로 잘 정리해서.') },
      { icon: '⏹', label: '중지', fn: () => this.stopGeneration() },
      { icon: '🔄', label: '초기화', fn: () => this.clearChat() },
    ].forEach(({ icon, label, fn }) => {
      const btn = toolbar.createEl('button', { cls: 'codex-toolbar-btn' });
      btn.createEl('span', { text: icon + ' ' + label });
      btn.onclick = fn;
    });

    // 입력 영역
    const inputArea = root.createDiv('codex-input-area');
    const inputRow = inputArea.createDiv('codex-input-row');
    this.inputEl = inputRow.createEl('textarea', {
      cls: 'codex-input',
      attr: { placeholder: 'Codex에게 메시지를 입력하세요... (Shift+Enter 전송)', rows: '1' }
    });
    this.sendBtn = inputRow.createEl('button', { cls: 'codex-send-btn', text: '➤' });
    inputArea.createDiv({ cls: 'codex-hint', text: 'Enter: 줄바꿈  |  Shift+Enter: 전송  |  Codex CLI 필요' });

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
    const el = this.messagesEl.createDiv('codex-empty');
    el.createDiv({ cls: 'codex-empty-icon', text: '💻' });
    el.createEl('p', { text: 'Codex Obsidian에 오신 것을 환영합니다!' });
    if (!this.codexAvailable) {
      const w = el.createEl('p', { text: '⚠️ Codex CLI가 설치되어 있지 않습니다.' });
      w.style.color = 'var(--color-red)';
      el.createEl('p', { text: '터미널에서: npm install -g @openai/codex@latest' });
      el.createEl('p', { text: '설치 후 설정에서 Codex 경로를 확인하세요.' });
    } else {
      el.createEl('p', { text: `✅ Codex ${this.codexVersion} 연결됨` });
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
      typing.createEl('span', { text: '⚡ Codex가 처리 중...' });
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
    if (!this.codexAvailable) {
      new Notice('⚠️ Codex CLI가 설치되어 있지 않습니다. 터미널에서: npm install -g @openai/codex@latest');
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
      const fullPrompt = context ? `${context}\n\n사용자 요청: ${userText}` : userText;
      const reply = await this.runCodex(fullPrompt);
      const t = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
      this.messages.push({ role: 'assistant', content: reply, time: t });

      if (this.plugin.settings.autoSave && this.isNoteRequest(userText)) {
        await this.saveAsNote(reply);
      }
    } catch (e) {
      this.messages.push({ role: 'assistant', content: `오류: ${e.message}`, time: now });
      new Notice(`Codex 오류: ${e.message}`);
    } finally {
      this.isLoading = false;
      this.sendBtn.disabled = false;
      this.currentProcess = null;
      this.renderMessages();
    }
  }

  async runCodex(prompt) {
    const { codexPath, model, approvalMode } = this.plugin.settings;
    return new Promise((resolve, reject) => {
      let output = '';
      this.currentProcess = CodexCLI.runStreaming({
        codexPath, prompt, model, approvalMode,
        onData: (chunk) => {
          output += chunk;
          // 스트리밍 중 마지막 메시지 실시간 업데이트
          if (this.messages.length > 0) {
            const last = this.messages[this.messages.length - 1];
            if (last.role === 'streaming') { last.content = output; this.renderMessages(); }
          }
        },
        onEnd: () => resolve(output.trim() || '응답을 받지 못했습니다.'),
        onError: (err) => {
          if (!output) reject(new Error(err));
        },
      });
    });
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
    this.pinnedNotes = [];
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

    new Setting(containerEl).setName('모델').setDesc('사용할 OpenAI 모델')
      .addDropdown(d => d
        .addOption('gpt-4o', 'GPT-4o (권장)')
        .addOption('gpt-4o-mini', 'GPT-4o Mini (빠름)')
        .addOption('o3', 'o3 (추론 특화)')
        .addOption('o4-mini', 'o4-mini (빠른 추론)')
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

  async loadSettings() { this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()); }
  async saveSettings() { await this.saveData(this.settings); }
  onunload() { this.app.workspace.detachLeavesOfType(VIEW_TYPE); }
}

module.exports = CodexObsidianPlugin;
