import { normalizePath, type TFile, type Vault } from "obsidian";
import type { LearningCardInput, SavedExplanationInput } from "./types";

function yamlString(value: string): string {
  return JSON.stringify(value.replace(/\r?\n/g, " "));
}

function sanitizeFilename(value: string): string {
  const cleaned = value
    .replace(/[\\/:*?"<>|#^[\]]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return cleaned || "Untitled learning card";
}

function quotedMarkdown(value: string): string {
  return value.split("\n").map((line) => `> ${line}`).join("\n");
}

export function serializeLearningCard(input: LearningCardInput): string {
  const typeLabel = input.type === "vocabulary" ? "Vocabulary card" : "Term card";
  return [
    "---",
    `card_type: ${input.type}`,
    `term: ${yamlString(input.term)}`,
    `status: ${input.status}`,
    `source: ${yamlString(input.context.notePath)}`,
    `source_line: ${input.context.sourceLine}`,
    `created: ${input.createdAt}`,
    "tags:",
    "  - synthesis-learning",
    `  - ${input.type}`,
    "---",
    "",
    `# ${input.term}`,
    "",
    `> [!info] ${typeLabel}`,
    `> Source: [[${input.context.notePath}]] · line ${input.context.sourceLine}`,
    "",
    "## Selected text",
    "",
    quotedMarkdown(input.context.selection),
    "",
    "## Reading context",
    "",
    quotedMarkdown(input.context.paragraph),
    "",
    input.question ? `## Learning question\n\n${input.question}\n` : "",
    input.explanation ? `## Tutor explanation\n\n${input.explanation}\n` : "",
    "## My notes",
    ""
  ].join("\n");
}

export function serializeSavedExplanation(input: SavedExplanationInput): string {
  const sourceList = input.sources.length > 0
    ? input.sources.map((source) => `- [[${source.path}]]`).join("\n")
    : "- No additional vault notes were retrieved.";
  return [
    "---",
    "type: tutor-explanation",
    `source: ${yamlString(input.context.notePath)}`,
    `scope: ${input.scope}`,
    `created: ${input.createdAt}`,
    "tags:",
    "  - synthesis-learning",
    "  - tutor-explanation",
    "---",
    "",
    `# ${input.context.noteTitle} — tutor explanation`,
    "",
    `Source: [[${input.context.notePath}]] · line ${input.context.sourceLine}`,
    "",
    "## Selected text",
    "",
    quotedMarkdown(input.context.selection),
    "",
    "## Question",
    "",
    input.question,
    "",
    "## Tutor explanation",
    "",
    input.explanation,
    "",
    "## Retrieved sources",
    "",
    sourceList,
    ""
  ].join("\n");
}

async function ensureFolder(vault: Vault, folderPath: string): Promise<void> {
  const normalized = normalizePath(folderPath);
  if (!normalized || vault.getAbstractFileByPath(normalized)) return;
  const parts = normalized.split("/");
  let current = "";
  for (const part of parts) {
    current = current ? `${current}/${part}` : part;
    if (!vault.getAbstractFileByPath(current)) await vault.createFolder(current);
  }
}

export async function createUniqueNote(
  vault: Vault,
  folderPath: string,
  preferredName: string,
  content: string
): Promise<TFile> {
  const folder = normalizePath(folderPath);
  await ensureFolder(vault, folder);
  const base = sanitizeFilename(preferredName);
  let suffix = 0;
  let path = normalizePath(`${folder}/${base}.md`);
  while (vault.getAbstractFileByPath(path)) {
    suffix += 1;
    path = normalizePath(`${folder}/${base} ${suffix}.md`);
  }
  return vault.create(path, content);
}
