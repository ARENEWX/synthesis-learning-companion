import {
  ItemView,
  MarkdownRenderer,
  Notice,
  setIcon,
  type WorkspaceLeaf
} from "obsidian";
import type SynthesisLearningPlugin from "./main";
import { defaultQuestion } from "./prompts";
import {
  TUTOR_VIEW_TYPE,
  type CardType,
  type ContextScope,
  type RetrievalSource,
  type SelectionContext,
  type TutorMode,
  type TutorTurn,
  type VoiceSlot
} from "./types";

export class TutorView extends ItemView {
  private context: SelectionContext | null = null;
  private mode: TutorMode = "explain";
  private contextScope: ContextScope = "selection";
  private turns: TutorTurn[] = [];
  private sources: RetrievalSource[] = [];
  private busy = false;

  constructor(leaf: WorkspaceLeaf, private readonly plugin: SynthesisLearningPlugin) {
    super(leaf);
  }

  getViewType(): string {
    return TUTOR_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Synthesis tutor";
  }

  getIcon(): string {
    return "book-open-check";
  }

  async onOpen(): Promise<void> {
    await this.render();
  }

  async setContext(context: SelectionContext, mode: TutorMode, autoAsk: boolean): Promise<void> {
    this.context = context;
    this.mode = mode;
    this.contextScope = context.selection ? "selection" : "note";
    this.turns = [];
    this.sources = [];
    await this.render();
    if (autoAsk) await this.send(defaultQuestion(mode, context.selection || context.noteTitle));
  }

  private async render(): Promise<void> {
    const root = this.contentEl;
    root.empty();
    root.addClass("synthesis-tutor-root");

    const header = root.createDiv({ cls: "synthesis-tutor-header" });
    const titleBlock = header.createDiv();
    titleBlock.createDiv({ cls: "synthesis-eyebrow", text: this.mode === "english" ? "English teacher" : "AI tutor" });
    titleBlock.createEl("h3", { text: this.context?.noteTitle ?? "Reading companion" });
    const clear = header.createEl("button", { cls: "clickable-icon", attr: { "aria-label": "Clear conversation" } });
    setIcon(clear, "rotate-ccw");
    clear.addEventListener("click", () => {
      this.turns = [];
      this.sources = [];
      void this.render();
    });

    if (!this.context) {
      const empty = root.createDiv({ cls: "synthesis-empty-state" });
      empty.createDiv({ cls: "synthesis-empty-mark", text: "Aa" });
      empty.createEl("h4", { text: "Read with a question in mind" });
      empty.createEl("p", { text: "Select text and choose Explain or English teacher, or open a Markdown note before asking about it." });
      return;
    }

    const controls = root.createDiv({ cls: "synthesis-context-controls" });
    const modeSelect = controls.createEl("select", { attr: { "aria-label": "Tutor mode" } });
    modeSelect.createEl("option", { value: "explain", text: "Explain" });
    modeSelect.createEl("option", { value: "english", text: "English teacher" });
    modeSelect.value = this.mode;
    modeSelect.addEventListener("change", () => {
      this.mode = modeSelect.value === "english" ? "english" : "explain";
    });
    const scopeSelect = controls.createEl("select", { attr: { "aria-label": "Context scope" } });
    scopeSelect.createEl("option", { value: "selection", text: "Selection" });
    scopeSelect.createEl("option", { value: "note", text: "Current note" });
    scopeSelect.createEl("option", { value: "vault", text: "Vault search" });
    scopeSelect.value = this.contextScope;
    scopeSelect.toggleAttribute("disabled", !this.context.selection);
    scopeSelect.addEventListener("change", () => {
      const value = scopeSelect.value;
      this.contextScope = value === "vault" ? "vault" : value === "note" ? "note" : "selection";
    });

    const contextCard = root.createDiv({ cls: `synthesis-context-card is-${this.context.markColor ?? "blue"}` });
    contextCard.createDiv({ cls: "synthesis-context-meta", text: `${this.context.notePath} · line ${this.context.sourceLine}` });
    contextCard.createEl("blockquote", {
      text: this.context.selection || this.context.paragraph || "Current note context"
    });
    const voiceActions = contextCard.createDiv({ cls: "synthesis-voice-actions" });
    this.voiceButton(voiceActions, "Female", "sparkles", "female");
    this.voiceButton(voiceActions, "Male", "user-round", "male");
    this.voiceButton(voiceActions, "Stop", "square", null);

    const conversation = root.createDiv({ cls: "synthesis-conversation" });
    if (this.turns.length === 0) {
      conversation.createDiv({ cls: "synthesis-conversation-hint", text: "The explanation will stay beside the source so you can keep reading." });
    }
    for (const turn of this.turns) {
      const message = conversation.createDiv({ cls: `synthesis-message is-${turn.role}` });
      message.createDiv({ cls: "synthesis-message-role", text: turn.role === "assistant" ? "Tutor" : "You" });
      const body = message.createDiv({ cls: "synthesis-message-body" });
      if (turn.role === "assistant") {
        await MarkdownRenderer.render(this.app, turn.content, body, this.context.notePath, this);
      } else {
        body.setText(turn.content);
      }
    }
    if (this.busy) {
      const waiting = conversation.createDiv({ cls: "synthesis-thinking" });
      waiting.createSpan({ text: "Reading the context" });
      waiting.createSpan({ cls: "synthesis-thinking-dot" });
      waiting.createSpan({ cls: "synthesis-thinking-dot" });
      waiting.createSpan({ cls: "synthesis-thinking-dot" });
    }

    if (this.sources.length > 0) {
      const sourceBox = root.createDiv({ cls: "synthesis-sources" });
      sourceBox.createDiv({ cls: "synthesis-eyebrow", text: "Local sources" });
      for (const source of this.sources) {
        const sourceButton = sourceBox.createEl("button", { text: source.path });
        sourceButton.addEventListener("click", () => void this.app.workspace.openLinkText(source.path, this.context?.notePath ?? "", false));
      }
    }

    const latestAssistant = [...this.turns].reverse().find((turn) => turn.role === "assistant");
    if (latestAssistant) {
      const actions = root.createDiv({ cls: "synthesis-save-actions" });
      this.actionButton(actions, "Save note", "file-plus-2", () => this.saveExplanation(latestAssistant));
      this.actionButton(actions, "Append", "list-plus", () => this.appendExplanation(latestAssistant));
      this.actionButton(actions, "Vocabulary card", "languages", () => this.saveCard("vocabulary", latestAssistant));
      this.actionButton(actions, "Term card", "library-big", () => this.saveCard("term", latestAssistant));
    }

    const composer = root.createEl("form", { cls: "synthesis-composer" });
    const input = composer.createEl("textarea", {
      attr: {
        rows: "3",
        placeholder: this.mode === "english" ? "Ask about this word or sentence…" : "Ask about this passage…",
        "aria-label": "Tutor question"
      }
    });
    input.disabled = this.busy;
    const footer = composer.createDiv({ cls: "synthesis-composer-footer" });
    footer.createSpan({ text: "Enter to send · Shift+Enter for a new line" });
    const sendButton = footer.createEl("button", { text: this.busy ? "Thinking…" : "Ask", attr: { type: "submit" } });
    sendButton.disabled = this.busy;
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        if (input.value.trim()) void this.send(input.value.trim());
      }
    });
    composer.addEventListener("submit", (event) => {
      event.preventDefault();
      if (input.value.trim()) void this.send(input.value.trim());
    });
  }

  private async send(question: string): Promise<void> {
    if (!this.context || this.busy) return;
    const history = [...this.turns];
    this.turns.push({ id: crypto.randomUUID(), role: "user", content: question, createdAt: new Date().toISOString() });
    this.busy = true;
    await this.render();
    try {
      const result = await this.plugin.askTutor(this.context, this.mode, this.contextScope, history, question);
      this.sources = result.sources;
      this.turns.push({ id: crypto.randomUUID(), role: "assistant", content: result.answer, createdAt: new Date().toISOString() });
    } catch (error) {
      const message = error instanceof Error ? error.message : "The tutor request failed.";
      new Notice(message);
      this.turns.push({
        id: crypto.randomUUID(),
        role: "assistant",
        content: `> [!failure] Tutor request failed\n> ${message}`,
        createdAt: new Date().toISOString()
      });
    } finally {
      this.busy = false;
      await this.render();
    }
  }

  private voiceButton(parent: HTMLElement, label: string, icon: string, slot: VoiceSlot | null): void {
    const button = parent.createEl("button", { cls: "synthesis-quiet-button", attr: { title: label } });
    setIcon(button, icon);
    button.createSpan({ text: label });
    button.addEventListener("click", () => {
      if (!this.context) return;
      if (slot) this.plugin.speak(this.context.selection || this.context.fullNote, slot);
      else this.plugin.stopSpeaking();
    });
  }

  private actionButton(parent: HTMLElement, label: string, icon: string, action: () => Promise<void>): void {
    const button = parent.createEl("button", { cls: "synthesis-action-button" });
    setIcon(button, icon);
    button.createSpan({ text: label });
    button.addEventListener("click", () => void action());
  }

  private latestQuestion(): string {
    return [...this.turns].reverse().find((turn) => turn.role === "user")?.content ?? "Tutor explanation";
  }

  private async saveExplanation(turn: TutorTurn): Promise<void> {
    if (!this.context) return;
    const file = await this.plugin.saveExplanation(this.context, this.contextScope, this.latestQuestion(), turn.content, this.sources);
    new Notice(`Saved ${file.path}`);
  }

  private async appendExplanation(turn: TutorTurn): Promise<void> {
    if (!this.context) return;
    await this.plugin.appendExplanation(this.context, this.latestQuestion(), turn.content);
    new Notice(`Appended to ${this.context.notePath}`);
  }

  private async saveCard(type: CardType, turn: TutorTurn): Promise<void> {
    if (!this.context) return;
    const file = await this.plugin.saveLearningCard(type, this.context, this.latestQuestion(), turn.content);
    new Notice(`Saved ${file.path}`);
  }
}
