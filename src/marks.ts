import type { Editor } from "obsidian";
import type { MarkColor, MarkStyle, SelectionContext } from "./types";

export function markSelectionText(
  selection: string,
  style: MarkStyle,
  color: MarkColor
): string {
  const wrapLine = (line: string): string => {
    if (!line.trim()) return line;
    if (style === "highlight") {
      return `<mark data-synthesis-color="${color}">${line}</mark>`;
    }
    return `<span data-synthesis-underline="${color}">${line}</span>`;
  };
  return selection.split("\n").map(wrapLine).join("\n");
}

export function applyReadingMark(
  editor: Editor,
  context: SelectionContext,
  style: MarkStyle,
  color: MarkColor
): void {
  editor.setSelection(context.from, context.to);
  editor.replaceSelection(markSelectionText(context.selection, style, color));
}

