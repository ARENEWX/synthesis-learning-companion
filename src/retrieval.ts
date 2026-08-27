import type { TFile, Vault } from "obsidian";
import type { RetrievalSource } from "./types";

export function tokenizeQuery(query: string): string[] {
  const normalized = query.toLocaleLowerCase();
  const latin = normalized.match(/[a-z0-9][a-z0-9_-]{1,}/g) ?? [];
  const cjkRuns = normalized.match(/[\u3400-\u9fff]+/g) ?? [];
  const cjk = cjkRuns.flatMap((run) => {
    if (run.length <= 2) return [run];
    return Array.from({ length: run.length - 1 }, (_, index) => run.slice(index, index + 2));
  });
  return [...new Set([...latin, ...cjk])].filter((token) => token.length > 1);
}

export function rankDocument(query: string, path: string, content: string): number {
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) return 0;
  const lowerPath = path.toLocaleLowerCase();
  const lowerContent = content.toLocaleLowerCase();
  let score = 0;
  for (const token of tokens) {
    if (lowerPath.includes(token)) score += 8;
    const occurrences = lowerContent.split(token).length - 1;
    score += Math.min(occurrences, 8);
  }
  return score;
}

export function excerptForQuery(query: string, content: string, maximum = 900): string {
  if (content.length <= maximum) return content.trim();
  const tokens = tokenizeQuery(query);
  const lowerContent = content.toLocaleLowerCase();
  const positions = tokens
    .map((token) => lowerContent.indexOf(token))
    .filter((position) => position >= 0);
  const center = positions.length > 0 ? Math.min(...positions) : 0;
  const start = Math.max(0, center - Math.floor(maximum * 0.3));
  const end = Math.min(content.length, start + maximum);
  return `${start > 0 ? "…" : ""}${content.slice(start, end).trim()}${end < content.length ? "…" : ""}`;
}

function isExcluded(file: TFile, excludedFolders: string[]): boolean {
  return excludedFolders.some((folder) => {
    const normalized = folder.replace(/^\/+|\/+$/g, "");
    return normalized.length > 0 && (file.path === normalized || file.path.startsWith(`${normalized}/`));
  });
}

export async function retrieveVaultSources(
  vault: Vault,
  query: string,
  limit: number,
  excludedFolders: string[]
): Promise<RetrievalSource[]> {
  const candidates: RetrievalSource[] = [];
  for (const file of vault.getMarkdownFiles()) {
    if (isExcluded(file, excludedFolders)) continue;
    const content = await vault.cachedRead(file);
    const score = rankDocument(query, file.path, content);
    if (score <= 0) continue;
    candidates.push({
      path: file.path,
      title: file.basename,
      excerpt: excerptForQuery(query, content),
      score
    });
  }
  return candidates.sort((left, right) => right.score - left.score).slice(0, limit);
}

