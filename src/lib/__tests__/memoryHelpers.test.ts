import { describe, expect, it } from "vitest";
import {
  isQuestionLike,
  makeMemoryTitle,
  rankMemoriesForQuery,
  splitFactsHeuristic,
} from "../memoryHelpers";
import { normalizeEntityName } from "../entity-normalization";

describe("isQuestionLike", () => {
  it("detects imperative query phrases", () => {
    expect(isQuestionLike("list out my hobbies")).toBe(true);
    expect(isQuestionLike("tell me my interests")).toBe(true);
    expect(isQuestionLike("show my projects")).toBe(true);
  });

  it("detects interrogative questions", () => {
    expect(isQuestionLike("What are my hobbies?")).toBe(true);
    expect(isQuestionLike("who am i")).toBe(true);
  });

  it("does not flag factual statements", () => {
    expect(isQuestionLike("I like hiking and music")).toBe(false);
    expect(isQuestionLike("My hobbies include photography")).toBe(false);
  });
});

describe("makeMemoryTitle", () => {
  it("keeps more context without over-truncating", () => {
    const title = makeMemoryTitle(
      "I like photography, gaming, hiking, and music. I also enjoy reading sci-fi books.",
      16,
      120
    );
    expect(title).toContain("photography");
    expect(title.length).toBeLessThanOrEqual(120);
  });
});

describe("splitFactsHeuristic", () => {
  it("splits comma-separated hobbies", () => {
    const facts = splitFactsHeuristic("I like photography, gaming, hiking, and music");
    expect(facts).toHaveLength(4);
    expect(facts).toEqual([
      "I like photography",
      "I like gaming",
      "I like hiking",
      "I like music",
    ]);
  });

  it("splits explicit hobbies lists", () => {
    const facts = splitFactsHeuristic("My hobbies include photography and gaming.");
    expect(facts).toEqual([
      "My hobbies include photography",
      "My hobbies include gaming",
    ]);
  });
});

describe("rankMemoriesForQuery", () => {
  it("prioritizes hobby memories for hobby queries", () => {
    const memories = [
      {
        id: "1",
        content: "My hobbies include photography",
        summary: "My hobbies include photography",
        tags: ["hobbies"],
      },
      {
        id: "2",
        content: "I work with Databricks",
        summary: "I work with Databricks",
        tags: ["work"],
      },
    ];

    const ranked = rankMemoriesForQuery("list my hobbies", memories, null, 5);
    expect(ranked[0].id).toBe("1");
  });
});

describe("normalizeEntityName", () => {
  it("trims, collapses whitespace, and casefolds names", () => {
    expect(normalizeEntityName("  Brain   Tumor  Classifier  ")).toBe("brain tumor classifier");
  });
});
