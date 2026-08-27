import { describe, expect, it } from "vitest";
import {
  extractParagraphAroundSelection,
  extractSentenceAroundSelection,
  truncateContext
} from "../src/context";

describe("reading context", () => {
  it("extracts the paragraph that contains the selection", () => {
    const content = "First paragraph.\n\nA model learns a latent representation. It is useful.\n\nLast.";
    const start = content.indexOf("latent");
    expect(extractParagraphAroundSelection(content, start, start + 6))
      .toBe("A model learns a latent representation. It is useful.");
  });

  it("extracts the containing sentence", () => {
    const paragraph = "A model learns a latent representation. It is useful.";
    expect(extractSentenceAroundSelection(paragraph, "latent representation"))
      .toBe("A model learns a latent representation.");
  });

  it("keeps both ends when truncating a note", () => {
    const result = truncateContext("a".repeat(60) + "z".repeat(40), 50);
    expect(result.startsWith("a".repeat(30))).toBe(true);
    expect(result.endsWith("z".repeat(20))).toBe(true);
    expect(result).toContain("content omitted");
  });
});
