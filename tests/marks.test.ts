import { describe, expect, it } from "vitest";
import { markSelectionText } from "../src/marks";

describe("reading marks", () => {
  it("creates portable HTML highlights", () => {
    expect(markSelectionText("attention", "highlight", "amber"))
      .toBe('<mark data-synthesis-color="amber">attention</mark>');
  });

  it("preserves blank lines in a multiline underline", () => {
    expect(markSelectionText("first\n\nsecond", "underline", "blue"))
      .toBe('<span data-synthesis-underline="blue">first</span>\n\n<span data-synthesis-underline="blue">second</span>');
  });
});
