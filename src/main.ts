import {
  MarkdownView,
  Notice,
  Plugin,
  TFile,
  type Editor,
  type WorkspaceLeaf
} from "obsidian";
import { createTutorResponse } from "./ai";
import { buildActiveNoteContext, buildSelectionContext } from "./context";
import { applyReadingMark } from "./marks";
import {
  createUniqueNote,
  serializeLearningCard,
  serializeSavedExplanation
} from "./notes";
import { buildPromptMessages, tutorInstructions } from "./prompts";
import { retrieveVaultSources } from "./retrieval";
import { SelectionToolbar } from "./selection-toolbar";
import { SynthesisSettingTab } from "./settings";
import { TutorView } from "./tutor-view";
import {
  API_KEY_SECRET_ID,
  DEFAULT_SETTINGS,
  TUTOR_VIEW_TYPE,
  type CardType,
  type ContextScope,
  type MarkColor,
  type MarkStyle,
  type RetrievalSource,
  type SelectionContext,
  type SynthesisSettings,
  type TutorMode,
  type TutorTurn,
  type VoiceSlot
} from "./types";
import { speakText, stopSpeaking } from "./voice";

export default class SynthesisLearningPlugin extends Plugin {
  settings: SynthesisSettings = { ...DEFAULT_SETTINGS };
  private toolbar: SelectionToolbar | null = null;
  private selectionTimer: number | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.toolbar = new SelectionToolbar(this);
    this.registerView(TUTOR_VIEW_TYPE, (leaf) => new TutorView(leaf, this));
    this.addSettingTab(new SynthesisSettingTab(this.app, this));

    this.addRibbonIcon("book-open-check", "Open Synthesis tutor", () => {
      void this.openForActiveNote();
    });

    this.addCommand({
      id: "open-tutor-for-active-note",
      name: "Open tutor for active note",
      callback: () => void this.openForActiveNote()
    });
    this.addCommand({
      id: "explain-selection",
      name: "Explain selection",
      editorCheckCallback: (checking, editor, view) => {
        if (!view.file) return false;
        const context = buildSelectionContext(editor, view.file);
        if (!context) return false;
        if (!checking) void this.openTutor(context, "explain", true);
        return true;
      }
    });
    this.addCommand({
      id: "english-teacher-for-selection",
      name: "Ask English teacher about selection",
      editorCheckCallback: (checking, editor, view) => {
        if (!view.file) return false;
        const context = buildSelectionContext(editor, view.file);
        if (!context) return false;
        if (!checking) void this.openTutor(context, "english", true);
        return true;
      }
    });
    this.addCommand({
      id: "read-selection-female-voice",
      name: "Read selection with female voice slot",
      editorCheckCallback: (checking, editor) => {
        const selection = editor.getSelection().trim();
        if (!selection) return false;
        if (!checking) this.speak(selection, "female");
        return true;
      }
    });
    this.addCommand({
      id: "read-selection-male-voice",
      name: "Read selection with male voice slot",
      editorCheckCallback: (checking, editor) => {
        const selection = editor.getSelection().trim();
        if (!selection) return false;
        if (!checking) this.speak(selection, "male");
        return true;
      }
    });
    this.addCommand({
      id: "stop-reading",
      name: "Stop reading aloud",
      callback: () => this.stopSpeaking()
    });

    this.registerEvent(this.app.workspace.on("editor-menu", (menu, editor, info) => {
      if (!(info instanceof MarkdownView) || !info.file) return;
      const context = buildSelectionContext(editor, info.file);
      if (!context) return;
      menu.addSeparator();
      menu.addItem((item) => item
        .setTitle("Explain with Synthesis tutor")
        .setIcon("sparkles")
        .onClick(() => void this.openTutor(context, "explain", true)));
      menu.addItem((item) => item
        .setTitle("Ask Synthesis English teacher")
        .setIcon("languages")
        .onClick(() => void this.openTutor(context, "english", true)));
    }));

    this.registerDomEvent(document, "mouseup", () => this.scheduleToolbar());
    this.registerDomEvent(document, "keyup", (event) => {
      if (event.key.startsWith("Arrow") || event.key === "Shift") this.scheduleToolbar();
    });
    this.registerDomEvent(document, "mousedown", (event) => {
      const target = event.target;
      if (target instanceof Node && !this.toolbarElementContains(target)) this.toolbar?.hide();
    }, { capture: true });

    this.register(() => {
      this.toolbar?.hide();
      if (this.selectionTimer !== null) window.clearTimeout(this.selectionTimer);
      stopSpeaking();
    });
  }

  onunload(): void {
    stopSpeaking();
  }

  getApiKey(): string {
    return this.app.secretStorage.getSecret(API_KEY_SECRET_ID) ?? "";
  }

  setApiKey(value: string): void {
    this.app.secretStorage.setSecret(API_KEY_SECRET_ID, value);
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  applyMark(editor: Editor, context: SelectionContext, style: MarkStyle, color: MarkColor): void {
    applyReadingMark(editor, context, style, color);
  }

  async openTutor(context: SelectionContext, mode: TutorMode, autoAsk: boolean): Promise<void> {
    this.toolbar?.hide();
    let leaf = this.app.workspace.getLeavesOfType(TUTOR_VIEW_TYPE)[0];
    if (!leaf) {
      leaf = this.app.workspace.getRightLeaf(false) ?? this.app.workspace.getLeaf("split", "vertical");
      await leaf.setViewState({ type: TUTOR_VIEW_TYPE, active: true });
    }
    await this.app.workspace.revealLeaf(leaf);
    if (leaf.view instanceof TutorView) await leaf.view.setContext(context, mode, autoAsk);
  }

  speak(text: string, slot: VoiceSlot): void {
    try {
      speakText(text, slot, this.settings);
    } catch (error) {
      new Notice(error instanceof Error ? error.message : "Reading aloud failed.");
    }
  }

  stopSpeaking(): void {
    stopSpeaking();
  }

  async askTutor(
    context: SelectionContext,
    mode: TutorMode,
    scope: ContextScope,
    history: TutorTurn[],
    question: string
  ): Promise<{ answer: string; sources: RetrievalSource[] }> {
    const sources = scope === "vault"
      ? await retrieveVaultSources(
        this.app.vault,
        `${context.selection} ${question}`,
        this.settings.vaultResultLimit,
        this.excludedFolders()
      )
      : [];
    const answer = await createTutorResponse({
      apiBaseUrl: this.settings.apiBaseUrl,
      apiKey: this.getApiKey(),
      model: this.settings.model,
      protocol: this.settings.protocol,
      instructions: tutorInstructions(mode),
      messages: buildPromptMessages(
        context,
        scope,
        this.settings.maxContextCharacters,
        sources,
        history,
        question
      ),
      maxOutputTokens: this.settings.maxOutputTokens
    });
    return { answer, sources };
  }

  async saveExplanation(
    context: SelectionContext,
    scope: ContextScope,
    question: string,
    explanation: string,
    sources: RetrievalSource[]
  ): Promise<TFile> {
    const file = await createUniqueNote(
      this.app.vault,
      this.settings.explanationFolder,
      `${context.noteTitle} — ${context.selection || "note"}`,
      serializeSavedExplanation({
        context,
        scope,
        question,
        explanation,
        sources,
        createdAt: new Date().toISOString()
      })
    );
    await this.maybeOpen(file);
    return file;
  }

  async appendExplanation(context: SelectionContext, question: string, explanation: string): Promise<void> {
    const source = this.app.vault.getAbstractFileByPath(context.notePath);
    if (!(source instanceof TFile)) throw new Error("The source note no longer exists.");
    const block = [
      "",
      "---",
      "",
      `> [!quote] Selected at line ${context.sourceLine}`,
      ...context.selection.split("\n").map((line) => `> ${line}`),
      "",
      `**Question:** ${question}`,
      "",
      explanation,
      ""
    ].join("\n");
    await this.app.vault.process(source, (content) => `${content.trimEnd()}\n${block}`);
  }

  async saveLearningCard(
    type: CardType,
    context: SelectionContext,
    question: string,
    explanation: string
  ): Promise<TFile> {
    const term = context.selection.trim() || context.noteTitle;
    const file = await createUniqueNote(
      this.app.vault,
      this.settings.cardFolder,
      term,
      serializeLearningCard({
        type,
        term,
        status: "learning",
        context,
        explanation,
        question,
        createdAt: new Date().toISOString()
      })
    );
    await this.maybeOpen(file);
    return file;
  }

  private async loadSettings(): Promise<void> {
    const stored = await this.loadData() as Partial<SynthesisSettings> | null;
    this.settings = { ...DEFAULT_SETTINGS, ...(stored ?? {}) };
  }

  private async openForActiveNote(): Promise<void> {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view?.file) {
      new Notice("Open a Markdown note first.");
      return;
    }
    const context = buildSelectionContext(view.editor, view.file)
      ?? buildActiveNoteContext(view.editor, view.file);
    await this.openTutor(context, context.selection ? "explain" : "explain", false);
  }

  private scheduleToolbar(): void {
    if (this.selectionTimer !== null) window.clearTimeout(this.selectionTimer);
    this.selectionTimer = window.setTimeout(() => {
      this.selectionTimer = null;
      this.showToolbarForSelection();
    }, 20);
  }

  private showToolbarForSelection(): void {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    const selection = window.getSelection();
    if (!view?.file || !selection || selection.isCollapsed || selection.rangeCount === 0) {
      this.toolbar?.hide();
      return;
    }
    const context = buildSelectionContext(view.editor, view.file);
    const rectangle = selection.getRangeAt(0).getBoundingClientRect();
    if (!context || (rectangle.width === 0 && rectangle.height === 0)) {
      this.toolbar?.hide();
      return;
    }
    this.toolbar?.show(context, view.editor, rectangle);
  }

  private toolbarElementContains(node: Node): boolean {
    return node.instanceOf(Element) && node.closest(".synthesis-selection-toolbar") !== null;
  }

  private excludedFolders(): string[] {
    return [
      ...this.settings.excludedFolders.split(","),
      this.settings.cardFolder,
      this.settings.explanationFolder
    ].map((folder) => folder.trim()).filter(Boolean);
  }

  private async maybeOpen(file: TFile): Promise<void> {
    if (!this.settings.autoOpenCreatedNote) return;
    const leaf: WorkspaceLeaf = this.app.workspace.getLeaf("tab");
    await leaf.openFile(file);
  }
}
