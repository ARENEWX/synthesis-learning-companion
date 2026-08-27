import { setIcon, type Editor } from "obsidian";
import type SynthesisLearningPlugin from "./main";
import type { MarkColor, MarkStyle, SelectionContext } from "./types";

export class SelectionToolbar {
  private element: HTMLDivElement | null = null;
  private style: MarkStyle = "highlight";

  constructor(private readonly plugin: SynthesisLearningPlugin) {}

  hide(): void {
    this.element?.remove();
    this.element = null;
  }

  show(context: SelectionContext, editor: Editor, rectangle: DOMRect): void {
    this.hide();
    const toolbar = document.body.createDiv({ cls: "synthesis-selection-toolbar" });
    toolbar.setAttribute("role", "toolbar");
    toolbar.setAttribute("aria-label", "Synthesis learning actions");
    toolbar.addEventListener("mousedown", (event) => event.preventDefault());
    this.element = toolbar;

    const highlightButton = this.iconButton(toolbar, "highlighter", "Highlight style", () => {
      this.style = "highlight";
      this.updateStyleButtons(highlightButton, underlineButton);
    });
    const underlineButton = this.iconButton(toolbar, "underline", "Underline style", () => {
      this.style = "underline";
      this.updateStyleButtons(highlightButton, underlineButton);
    });
    this.updateStyleButtons(highlightButton, underlineButton);

    const palette = toolbar.createDiv({ cls: "synthesis-toolbar-palette" });
    for (const color of ["amber", "blue", "green", "rose"] as MarkColor[]) {
      const button = palette.createEl("button", {
        cls: `synthesis-color-button is-${color}`,
        attr: { "aria-label": `${color} ${this.style}` }
      });
      button.addEventListener("click", () => {
        this.plugin.applyMark(editor, context, this.style, color);
        this.hide();
      });
    }

    toolbar.createDiv({ cls: "synthesis-toolbar-divider" });
    this.textButton(toolbar, "解释", "Explain selection", () => this.plugin.openTutor(context, "explain", true));
    this.textButton(toolbar, "英语", "Open English teacher", () => this.plugin.openTutor(context, "english", true));
    this.iconButton(toolbar, "volume-2", "Speak with female voice", () => this.plugin.speak(context.selection, "female"));
    this.iconButton(toolbar, "user-round", "Speak with male voice", () => this.plugin.speak(context.selection, "male"));

    const desiredLeft = rectangle.left + rectangle.width / 2 - toolbar.offsetWidth / 2;
    const left = Math.max(8, Math.min(window.innerWidth - toolbar.offsetWidth - 8, desiredLeft));
    const top = Math.max(8, Math.min(window.innerHeight - toolbar.offsetHeight - 8, rectangle.bottom + 8));
    toolbar.style.left = `${left}px`;
    toolbar.style.top = `${top}px`;
  }

  private iconButton(
    parent: HTMLElement,
    icon: string,
    label: string,
    action: () => void | Promise<void>
  ): HTMLButtonElement {
    const button = parent.createEl("button", {
      cls: "synthesis-toolbar-button",
      attr: { "aria-label": label, title: label }
    });
    setIcon(button, icon);
    button.addEventListener("click", () => void action());
    return button;
  }

  private textButton(
    parent: HTMLElement,
    text: string,
    label: string,
    action: () => void | Promise<void>
  ): HTMLButtonElement {
    const button = parent.createEl("button", {
      text,
      cls: "synthesis-toolbar-text-button",
      attr: { "aria-label": label, title: label }
    });
    button.addEventListener("click", () => void action());
    return button;
  }

  private updateStyleButtons(highlight: HTMLButtonElement, underline: HTMLButtonElement): void {
    highlight.toggleClass("is-active", this.style === "highlight");
    underline.toggleClass("is-active", this.style === "underline");
  }
}

