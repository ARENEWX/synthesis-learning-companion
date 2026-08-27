import { truncateContext } from "./context";
import type {
  ContextScope,
  RetrievalSource,
  SelectionContext,
  TutorMode,
  TutorTurn
} from "./types";

export interface PromptMessage {
  role: "user" | "assistant";
  content: string;
}

export function tutorInstructions(mode: TutorMode): string {
  if (mode === "english") {
    return [
      "You are an English reading teacher for a Chinese-speaking technical learner.",
      "Ground every explanation in the supplied sentence and paragraph rather than listing every dictionary meaning.",
      "Reply in concise Chinese with the English term preserved.",
      "Include: contextual meaning, part of speech, IPA when known, pronunciation guidance, why this meaning fits, common collocations, one parallel English example, and important alternative meanings.",
      "Do not invent a pronunciation or source fact when uncertain; state the uncertainty."
    ].join(" ");
  }
  return [
    "You are a rigorous but approachable tutor helping a learner read technical material.",
    "Explain the selected passage or term in its supplied context.",
    "Reply in Chinese unless asked otherwise.",
    "Prefer: plain-language meaning, role in the passage, prerequisites, one concrete example, and likely misconceptions.",
    "Do not claim access to notes that were not included in the request."
  ].join(" ");
}

export function buildContextBlock(
  context: SelectionContext,
  scope: ContextScope,
  maxCharacters: number,
  sources: RetrievalSource[]
): string {
  const sections = [
    `Source note: ${context.noteTitle}`,
    `Source path: ${context.notePath}`,
    `Source line: ${context.sourceLine}`,
    `Selected text:\n${context.selection}`,
    `Containing sentence:\n${context.sentence}`,
    `Containing paragraph:\n${context.paragraph}`
  ];
  if (scope === "note") {
    sections.push(`Current note:\n${truncateContext(context.fullNote, maxCharacters)}`);
  }
  if (scope === "vault" && sources.length > 0) {
    sections.push(
      `Locally retrieved vault excerpts:\n${sources
        .map((source, index) => `[${index + 1}] ${source.path}\n${source.excerpt}`)
        .join("\n\n")}`
    );
  }
  return sections.join("\n\n");
}

export function buildPromptMessages(
  context: SelectionContext,
  scope: ContextScope,
  maxCharacters: number,
  sources: RetrievalSource[],
  history: TutorTurn[],
  question: string
): PromptMessage[] {
  const boundedHistory = history.slice(-8).map((turn) => ({
    role: turn.role,
    content: turn.content
  }));
  const contextBlock = buildContextBlock(context, scope, maxCharacters, sources);
  return [
    ...boundedHistory,
    {
      role: "user",
      content: `${contextBlock}\n\nLearner request:\n${question}`
    }
  ];
}

export function defaultQuestion(mode: TutorMode, selection: string): string {
  return mode === "english"
    ? `请解释 “${selection}” 在原句中的意思。`
    : `请解释这段内容：“${selection}”`;
}

