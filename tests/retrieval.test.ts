import { describe, expect, it } from "vitest";
import { excerptForQuery, rankDocument, tokenizeQuery } from "../src/retrieval";

describe("local vault retrieval", () => {
  it("tokenizes English words and Chinese bigrams", () => {
    expect(tokenizeQuery("latent variable 专有名词")).toEqual(expect.arrayContaining(["latent", "variable", "专有", "有名"]));
  });

  it("weights a title match above a body-only match", () => {
    const titleScore = rankDocument("transformer", "Papers/Transformer.md", "notes");
    const bodyScore = rankDocument("transformer", "Papers/Models.md", "a transformer model");
    expect(titleScore).toBeGreaterThan(bodyScore);
  });

  it("centers excerpts near the query", () => {
    const content = `${"before ".repeat(100)}needle ${"after ".repeat(100)}`;
    const excerpt = excerptForQuery("needle", content, 120);
    expect(excerpt).toContain("needle");
    expect(excerpt.length).toBeLessThanOrEqual(122);
  });
});
