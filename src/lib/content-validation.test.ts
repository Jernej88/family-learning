import { describe, expect, it } from "vitest";

import { dateOnlySchema } from "./content-schema";
import { validateQuiz, validateStorySource } from "./content-validation";

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
    const result = validateQuiz({ topic: "luna", questions: [validQuestion] }, "luna");
    expect(result.errors).toEqual([]);
  });

  it("reports invalid answer indexes and topic mismatches", () => {
    const result = validateQuiz(
      { topic: "drug-tema", questions: [{ ...validQuestion, correct: 4 }] },
      "luna",
    );
    expect(result.errors.join(" ")).toContain("existing option");
  });

  it("reports duplicate question ids", () => {
    const result = validateQuiz(
      { topic: "luna", questions: [validQuestion, validQuestion] },
      "luna",
    );
    expect(result.errors).toContain('duplicate question id "luna-001"');
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
