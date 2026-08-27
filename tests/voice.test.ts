import { describe, expect, it } from "vitest";
import { cleanTextForSpeech, splitSpeechText } from "../src/voice";

describe("English reading", () => {
  it("removes Markdown syntax before speaking", () => {
    expect(cleanTextForSpeech("# Title\nRead **this** [[Note|phrase]]."))
      .toBe("Title Read this phrase.");
  });

  it("splits a long document at sentence boundaries", () => {
    const chunks = splitSpeechText("One short sentence. Another short sentence. Last one.", 32);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length <= 32)).toBe(true);
  });
});
