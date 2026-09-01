# Topic authoring contract

Use this contract when a person or agent adds a learning story. Product intent and pedagogy live in [the V1 design](design-v1.md); the Moon [topic](../src/content/topics/zakaj-luna-ne-pade-na-zemljo/index.mdx) and [quiz](../src/content/topics/zakaj-luna-ne-pade-na-zemljo/quiz.json) are the executable examples.

## Output

Create one self-contained bundle without changing application code:

```text
src/content/topics/<slug>/
├── index.mdx
└── quiz.json
```

Use a lowercase kebab-case slug. The directory, frontmatter `slug`, and quiz `topic` must match.

## Story file

Start with this frontmatter contract; dates use `YYYY-MM-DD`.

```yaml
---
title: "Question used as the story title"
slug: "matching-directory-slug"
description: "A concrete 20–180 character summary."
category: "vesolje"
tags: [luna, gravitacija]
created: "2026-09-01"
last_updated: "2026-09-01"
last_verified: "2026-09-01"
stability: stable # stable | developing | changing
review_interval_days: 365
recommended_age_min: 7
recommended_age_max: 12
estimated_minutes: 8
status: draft # draft | published
sources:
  - title: "Institution and page title"
    url: "https://example.org/source"
    language: "sl"
    authority: primary # primary | institutional | reference
---
```

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

A normal published story must:

- open with a clear hook and child-readable Slovenian narrative;
- place at least three meaningful interactions before the recap;
- include `KeyFacts`, a useful `ParentNote`, and optional deeper material;
- use 3–8 strong sources, preferring authoritative Slovenian sources where available;
- distinguish simplification from literal explanation and state uncertainty honestly.

The layout renders the frontmatter title and sources, so do not add a second level-one heading or a manual source list.

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

For `true_false`, omit `options` and use a boolean `correct`. IDs must be unique across the repository; difficulty is `1`–`3`.

## Review loop

1. Research claims against the source policy in [design §20](design-v1.md#20-source-policy).
2. Draft the story, interactions, parent caveats, and quiz.
3. Set `status: draft` while reviewing factual accuracy, Slovenian clarity, safety, and source quality.
4. Set `status: published` and run `npm run validate`, `npm test`, and `npm run build`.
5. Submit for human review; generated educational content is never published automatically.
