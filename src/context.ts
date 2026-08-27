import type { Editor, TFile } from "obsidian";
import type { SelectionContext } from "./types";

export function extractParagraphAroundSelection(
  content: string,
  startOffset: number,
  endOffset: number
): string {
  const safeStart = Math.max(0, Math.min(startOffset, content.length));
  const safeEnd = Math.max(safeStart, Math.min(endOffset, content.length));
  const before = content.slice(0, safeStart);
  const after = content.slice(safeEnd);
  const precedingBreaks = [...before.matchAll(/\n\s*\n/g)];
  const start = precedingBreaks.length > 0
    ? (precedingBreaks.at(-1)?.index ?? -2) + (precedingBreaks.at(-1)?.[0].length ?? 2)
    : 0;
  const followingBreak = after.match(/\n\s*\n/);
  const end = followingBreak?.index === undefined ? content.length : safeEnd + followingBreak.index;
  return content.slice(start, end).trim();
}

export function extractSentenceAroundSelection(
  paragraph: string,
  selection: string
): string {
  if (!paragraph.trim()) return selection.trim();
  const selectionIndex = paragraph.indexOf(selection);
  if (selectionIndex < 0) return paragraph.trim();
  const before = paragraph.slice(0, selectionIndex);
  const after = paragraph.slice(selectionIndex + selection.length);
  const sentenceStartMatch = before.match(/[^.!?。！？\n]*$/);
  const sentenceEndMatch = after.match(/^[^.!?。！？\n]*(?:[.!?。！？]|$)/);
  const sentenceStart = selectionIndex - (sentenceStartMatch?.[0].length ?? 0);
  const sentenceEnd = selectionIndex + selection.length + (sentenceEndMatch?.[0].length ?? 0);
  return paragraph.slice(sentenceStart, sentenceEnd).trim();
}

export function buildSelectionContext(editor: Editor, file: TFile): SelectionContext | null {
  const selection = editor.getSelection().trim();
  if (!selection) return null;
  const from = editor.getCursor("from");
  const to = editor.getCursor("to");
  const fullNote = editor.getValue();
  const startOffset = editor.posToOffset(from);
  const endOffset = editor.posToOffset(to);
  const paragraph = extractParagraphAroundSelection(fullNote, startOffset, endOffset);
  return {
    selection,
    paragraph,
    sentence: extractSentenceAroundSelection(paragraph, selection),
    fullNote,
    noteTitle: file.basename,
    notePath: file.path,
    sourceLine: from.line + 1,
    from,
    to
  };
}

export function buildActiveNoteContext(editor: Editor, file: TFile): SelectionContext {
  const fullNote = editor.getValue();
  const cursor = editor.getCursor();
  const offset = editor.posToOffset(cursor);
  const paragraph = extractParagraphAroundSelection(fullNote, offset, offset);
  return {
    selection: "",
    paragraph,
    sentence: paragraph,
    fullNote,
    noteTitle: file.basename,
    notePath: file.path,
    sourceLine: cursor.line + 1,
    from: cursor,
    to: cursor
  };
}

export function truncateContext(content: string, maximumCharacters: number): string {
  if (content.length <= maximumCharacters) return content;
  const headLength = Math.floor(maximumCharacters * 0.6);
  const tailLength = maximumCharacters - headLength;
  return `${content.slice(0, headLength)}\n\n[…content omitted…]\n\n${content.slice(-tailLength)}`;
}
