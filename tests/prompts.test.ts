import { describe, expect, it } from "vitest";
import { buildPromptMessages, tutorInstructions } from "../src/prompts";
import type { SelectionContext, TutorTurn } from "../src/types";

const context: SelectionContext = {
  selection: "gradient descent",
  sentence: "We optimize it with gradient descent.",
  paragraph: "We optimize it with gradient descent. The step size matters.",
  fullNote: "# Optimization\n\nWe optimize it with gradient descent. The step size matters.",
  noteTitle: "Optimization",
  notePath: "Papers/Optimization.md",
  sourceLine: 3,
  from: { line: 2, ch: 20 },
  to: { line: 2, ch: 36 }
};

describe("tutor prompts", () => {
  it("grounds an English explanation in local context", () => {
    expect(tutorInstructions("english")).toContain("supplied sentence and paragraph");
    const messages = buildPromptMessages(context, "selection", 10_000, [], [], "Explain it");
    expect(messages[0]?.content).toContain("gradient descent");
    expect(messages[0]?.content).not.toContain("Current note:");
  });

  it("keeps only the latest eight conversation turns", () => {
    const history: TutorTurn[] = Array.from({ length: 10 }, (_, index) => ({
      id: String(index),
      role: index % 2 === 0 ? "user" : "assistant",
      content: `turn ${index}`,
      createdAt: "2026-08-27T00:00:00.000Z"
    }));
    const messages = buildPromptMessages(context, "note", 10_000, [], history, "Continue");
    expect(messages).toHaveLength(9);
    expect(messages[0]?.content).toBe("turn 2");
    expect(messages.at(-1)?.content).toContain("Current note:");
  });
});
