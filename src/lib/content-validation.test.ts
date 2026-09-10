import { describe, expect, it } from "vitest";

import { dateOnlySchema, topicSchema } from "./content-schema";
import { validateQuiz, validateStorySource } from "./content-validation";

const topicBase = {
  title: "Preskusna tema",
  slug: "preskusna-tema",
  description: "Dovolj dolg in konkreten opis preskusne učne teme.",
  category: "preizkus",
  tags: ["preizkus"],
  created: "2026-09-01",
  last_updated: "2026-09-01",
  last_verified: "2026-09-01",
  stability: "stable",
  review_interval_days: 365,
  estimated_minutes: 8,
  status: "published",
  sources: [
    {
      title: "Preskusni vir",
      url: "https://example.com/source",
      language: "sl",
      authority: "institutional",
    },
  ],
};

const validQuestion = {
  id: "luna-001",
  type: "multiple_choice",
  concept: "orbita",
  difficulty: 1,
  age_min: 7,
  question: "Kaj ohranja Luno v orbiti?",
  options: ["Gravitacija", "Veter"],
  correct: 0,
  explanation: "Zemljina gravitacija ukrivlja Lunino pot okoli Zemlje.",
};

describe("validateQuiz", () => {
  it("accepts a quiz matching its topic", () => {
    const result = validateQuiz({ topic: "luna", questions: [validQuestion] }, "luna", "child");
    expect(result.errors).toEqual([]);
  });

  it("reports invalid answer indexes and topic mismatches", () => {
    const result = validateQuiz(
      { topic: "drug-tema", questions: [{ ...validQuestion, correct: 4 }] },
      "luna",
      "child",
    );
    expect(result.errors.join(" ")).toContain("existing option");
  });

  it("reports duplicate question ids", () => {
    const result = validateQuiz(
      { topic: "luna", questions: [validQuestion, validQuestion] },
      "luna",
      "child",
    );
    expect(result.errors).toContain('duplicate question id "luna-001"');
  });

  it("requires age 18 for every adult quiz question", () => {
    const result = validateQuiz(
      { topic: "luna", questions: [validQuestion] },
      "luna",
      "adult",
    );

    expect(result.errors).toEqual(["questions.0.age_min: adult topic questions must use 18"]);
    expect(
      validateQuiz(
        { topic: "luna", questions: [{ ...validQuestion, age_min: 18 }] },
        "luna",
        "adult",
      ).errors,
    ).toEqual([]);
  });
});

describe("validateStorySource", () => {
  it("accepts the minimum interactive-story contract", () => {
    const source = "<Prediction />\n<Reveal />\n<Think />\n<KeyFacts />\n<ParentNote />";
    expect(validateStorySource(source)).toEqual([]);
  });

  it("explains missing story elements", () => {
    expect(validateStorySource("<Prediction />")).toHaveLength(3);
  });

  it("ignores component text in comments and code blocks", () => {
    const source = `
{/* <Prediction /> */}

\`\`\`mdx
<Reveal />
<Think />
\`\`\`

<KeyFacts items={[]} />
<ParentNote />`;

    expect(validateStorySource(source)).toContain(
      "published stories need at least three meaningful inline interactions before the KeyFacts recap",
    );
  });

  it("does not count interactions placed after the recap", () => {
    const source = `
<Prediction />
<KeyFacts items={[]} />
<Reveal />
<Think />
<ParentNote />`;

    expect(validateStorySource(source)).toContain(
      "published stories need at least three meaningful inline interactions before the KeyFacts recap",
    );
  });
});

describe("dateOnlySchema", () => {
  it("converts an exact calendar date to UTC", () => {
    expect(dateOnlySchema.parse("2026-09-01").toISOString()).toBe("2026-09-01T00:00:00.000Z");
  });

  it.each(["2026-02-31", "09/01/2026", "2026-9-1"])("rejects %s", (value) => {
    expect(dateOnlySchema.safeParse(value).success).toBe(false);
  });
});

describe("topicSchema audiences", () => {
  it("accepts child topics with a valid recommended age range", () => {
    const result = topicSchema.safeParse({
      ...topicBase,
      audience: "child",
      recommended_age_min: 7,
      recommended_age_max: 12,
    });

    expect(result.success).toBe(true);
  });

  it("accepts adult topics without a recommended age range", () => {
    const result = topicSchema.safeParse({ ...topicBase, audience: "adult" });

    expect(result.success).toBe(true);
  });

  it("rejects a missing audience", () => {
    const result = topicSchema.safeParse(topicBase);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.map((issue) => issue.path)).toContainEqual(["audience"]);
  });

  it("reports both missing child age fields", () => {
    const result = topicSchema.safeParse({ ...topicBase, audience: "child" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path)).toEqual(
        expect.arrayContaining([["recommended_age_min"], ["recommended_age_max"]]),
      );
    }
  });

  it.each([
    {
      audience: "child",
      recommended_age_min: 12,
      recommended_age_max: 7,
    },
    {
      audience: "adult",
      recommended_age_min: 18,
      recommended_age_max: 18,
    },
  ])("rejects invalid audience age metadata: %j", (metadata) => {
    expect(topicSchema.safeParse({ ...topicBase, ...metadata }).success).toBe(false);
  });
});
