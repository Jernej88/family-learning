# Topic authoring contract

Use this contract when a person or agent adds a learning story. Product intent and pedagogy live in [the V1 design](design-v1.md); the Moon [topic](../src/content/topics/zakaj-luna-ne-pade-na-zemljo/index.mdx) and [quiz](../src/content/topics/zakaj-luna-ne-pade-na-zemljo/quiz.json) are the executable child-topic examples. Cloud runs must also follow [the ChatGPT Work runbook](chatgpt-workflow.md).

## Preflight

Before research or writes, read the current default-branch versions of:

- `README.md`;
- the source policy and relevant lifecycle sections in `docs/design-v1.md`;
- this contract;
- `docs/topic-updating.md` when changing an existing topic;
- `src/lib/content-schema.ts` and `src/lib/content-validation.ts`; and
- one relevant existing topic bundle.

Restate the requested question and confirm `audience: child` or `audience: adult`. Ask one focused question before research when the answer would materially change the learning goal, reading level, product instructions, jurisdiction, or safe scope. For example, ask which LEGO SPIKE set and the child's approximate age when project choices depend on them.

Do not request or store a child's name or other identifying information. For legal, health, financial, or property-specific questions, establish the general jurisdiction and write a durable public decision process. Do not put addresses, parcel identifiers, private documents, names, or personalized conclusions in Git. If a safe public topic cannot answer the request, explain the boundary and stop.

## Output boundary

Create one self-contained bundle and update the generated review feed:

```text
src/content/topics/<slug>/index.mdx
src/content/topics/<slug>/quiz.json
src/content/topics/<slug>/<required-assets>
review-feed.json
```

Use a lowercase kebab-case slug. The directory, frontmatter `slug`, and quiz `topic` must match. Do not change application code, workflows, unrelated content, or repository settings as part of a topic proposal. In cloud Work, create one branch from the current `main` head: use `content/<slug>-<YYYYMMDD>` for a new topic and the pattern in `docs/topic-updating.md` for an update. Open a draft pull request. Never push to `main`, merge, force-push, or delete branches.

## Research and outline

1. Identify the learning objective and the concepts the reader should retain.
2. Research 3–8 strong sources using the order in [the source policy](design-v1.md#20-source-policy). Prefer authoritative Slovenian sources where their quality is comparable.
3. Trace important claims to a source. For changing or high-stakes material, distinguish national rules, local or situation-dependent rules, uncertainty, and decisions requiring a competent professional or public body.
4. Record source access dates for the pull-request handoff. Do not present product marketing as independent evidence.
5. Before writing MDX, outline the hook, explanation path, at least three meaningful interactions, recap, caveat note, and quiz coverage. Revise the outline if an interaction is merely decorative.

## Story file

Start with this shared frontmatter contract; dates use `YYYY-MM-DD`:

```yaml
---
title: "Question used as the story title"
slug: "matching-directory-slug"
description: "A concrete 20–180 character summary."
category: "vesolje"
tags: [luna, gravitacija]
audience: child # child | adult
created: "2026-09-01"
last_updated: "2026-09-01"
last_verified: "2026-09-01"
stability: stable # stable | developing | changing
review_interval_days: 365
recommended_age_min: 7
recommended_age_max: 12
estimated_minutes: 8
status: published # published in a draft PR so full validation runs
sources:
  - title: "Institution and page title"
    url: "https://example.org/source"
    language: "sl"
    authority: primary # primary | institutional | reference
---
```

Child topics require `recommended_age_min` and `recommended_age_max` between 5 and 18. Adult topics omit both fields. Adult topics remain public and family-safe, may use professional vocabulary, and must explain consequences and uncertainty. They are not personalized advice.

Import only the primitives the story uses from `src/components/learning/`. Their author-facing props are:

| Component | Required props / content |
|---|---|
| `Prediction`, `Choice` | `question`, `options`, zero-based `correct`, `explanation` |
| `Reveal` | body; optional `title` |
| `Think` | `question` and revealed discussion body |
| `Experiment` | `title`, body; optional `materials` |
| `Visual` | `caption`; `type="orbit"`, an image `src` + `alt`, or custom body |
| `DeepDive`, `ParentNote` | body; optional `title` |
| `KeyFacts` | `items` array |

Both audiences require a coherent Slovenian narrative, at least three meaningful interactions before `KeyFacts`, a recap, and a useful `ParentNote`. A child topic explains unfamiliar vocabulary and avoids unnecessary cognitive load. An adult topic may rename `ParentNote`, for example to `Pravna opomba` or `Pred izvedbo`, but retains the component.

The layout renders the frontmatter title and sources, so do not add another level-one heading or a manual source list.

## Quiz file

Published topics contain 15–30 reusable questions. Supported types are `multiple_choice` and `true_false`.

```json
{
  "topic": "matching-directory-slug",
  "questions": [
    {
      "id": "matching-directory-slug-001",
      "type": "multiple_choice",
      "concept": "gravity",
      "difficulty": 1,
      "age_min": 7,
      "question": "Question in Slovenian?",
      "options": ["First", "Second", "Third"],
      "correct": 1,
      "explanation": "Teach why the answer is correct."
    }
  ]
}
```

For `true_false`, omit `options` and use a boolean `correct`. IDs must be unique across the repository; difficulty is `1`–`3`. Use `age_min: 18` for every adult-topic question. The quiz must cover the important concepts and caveats in the story rather than isolated trivia.

## Self-review and validation

Before requesting human review, verify:

- audience classification and age metadata are correct;
- factual claims are supported by the listed sources;
- Slovenian and reading level suit the selected audience;
- the narrative or procedure is coherent;
- interactions advance understanding;
- quiz questions cover the important concepts and explanations teach;
- uncertainty and high-stakes boundaries are visible;
- no personal data appears; and
- the diff contains only the topic bundle and generated feed.

Regenerate and validate from the repository root:

```bash
npm run generate:review-feed
npm run validate
npm test
npm run test:root-build
npm run test:subpath
```

Commit `review-feed.json` only when the generator changes it. Keep the topic `published` in the draft PR so the strongest checks run; publication still requires human review and merge.

## Pull-request handoff

The draft PR and final response must state:

- a sanitized restatement of the original question and the chosen audience; never reproduce private details verbatim;
- story objective and key concepts;
- sources and access dates;
- important simplifications, uncertainty, and unresolved questions;
- every changed file;
- expected validation commands and observed CI status; and
- that factual, pedagogical, Slovenian-language, privacy, and merge review remain human responsibilities.

Cloud Work may fix CI failures only on its own topic branch and only within the allowed paths. If a passing topic requires application code, workflow, schema, or unrelated content changes, report the limitation and stop.

Published topics enter the daily **Knowledge review due** issue when `last_verified + review_interval_days` is today or earlier. Choose an interval that matches how likely the topic is to change:

| Stability | Typical review interval |
|---|---:|
| `stable` | 365 days |
| `developing` | 60–90 days |
| `changing` | 7–30 days |
