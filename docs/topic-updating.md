# Topic updating contract

Use this contract with [the authoring contract](topic-authoring.md) and, for cloud runs, [the ChatGPT Work runbook](chatgpt-workflow.md). An update treats the story, interactions, recap, caveat note, sources, metadata, and quiz as one educational unit.

## Preflight and scope

Read the current default-branch versions of the required authoring files and the complete existing topic bundle. Review its Git history when necessary to understand why a claim or interaction exists. Confirm the topic slug, current audience, reason for the update, and facts that need verification.

Classify the update before editing:

- **Verification-only:** current authoritative sources still support the material; reader-visible teaching content does not change.
- **Factual change:** evidence requires changing claims, explanations, caveats, sources, interactions, recap, or quiz answers.
- **Editorial change:** presentation changes without claiming a fresh factual review.
- **Audience reclassification:** the intended reader changes and the entire bundle must be reassessed.

Ask a focused question when scope, jurisdiction, audience, or the meaning of the requested correction is unclear. Never copy names, addresses, parcel identifiers, private documents, learning history, or personalized conclusions into Git.

## Dates and evidence

- Update `last_verified` only after checking the topic's material claims against current authoritative sources.
- Update `last_updated` when reader-visible story, interaction, source presentation, or quiz content changes.
- A verification-only review may change `last_verified`, stability, review interval, and generated feed without changing `last_updated`. Changing rendered source metadata also requires updating `last_updated`.
- An editorial change updates `last_updated` but not `last_verified` unless the factual review was also completed.
- A factual change normally updates both dates after the revised unit is verified.

Reassess `stability` and `review_interval_days` whenever evidence shows the topic changes more or less often than expected. Never advance `last_verified` for an incomplete or blocked review. Record material source disagreement and unresolved uncertainty in the story and PR.

## Whole-topic consistency

Trace every changed claim through all places where the learner may encounter it:

- opening hook and main explanation;
- `Prediction`, `Reveal`, `Choice`, `Think`, `Experiment`, and `Visual` content;
- `DeepDive` and `ParentNote` caveats;
- `KeyFacts` recap;
- quiz questions, correct answers, explanations, concepts, and ages;
- source metadata, stability, and verification interval; and
- any educational change-history section.

Change only affected content, but do not leave a formerly correct answer, recap statement, or interaction inconsistent with the revised explanation. Preserve question IDs when the same question remains conceptually valid; add a new ID when replacing it with a different question. Remove obsolete claims rather than retaining them for historical completeness. Git is the detailed history; add a reader-facing `Kaj se je spremenilo?` section only when the change itself teaches something useful.

## Audience changes

Do not reclassify a topic by editing only `audience`.

For `child`, require age-range metadata, child-readable Slovenian, explained vocabulary, manageable cognitive load, optional parent guidance, and age-appropriate quiz wording.

For `adult`, remove both recommended-age fields, set every quiz question to `age_min: 18`, permit appropriate professional vocabulary, and make consequences and decision boundaries explicit. Confirm the application behavior expected by the current schema: adult topics remain public and quiz-enabled but do not enter child completion or daily recall.

In either direction, review the prose, interactions, note title and content, recap, quiz, sources, card description, reading-time estimate, privacy, and high-stakes boundaries.

## Branch and file boundary

Use one branch from the current `main` head:

```text
content/<slug>-update-<YYYYMMDD>
```

Allowed changes are limited to the existing bundle and generated feed:

```text
src/content/topics/<slug>/index.mdx
src/content/topics/<slug>/quiz.json
src/content/topics/<slug>/<affected-assets>
review-feed.json
```

Do not broaden a topic update into application code, schemas, workflows, settings, or another topic. Never push to `main`, merge, force-push, or delete branches. If a correct update requires a broader change, report it as separate work and stop.

Keep the updated topic `published` in the draft PR so full validation runs. Regenerate the feed and run:

```bash
npm run generate:review-feed
npm run validate
npm test
npm run test:root-build
npm run test:subpath
```

## Review and handoff

Apply the authoring self-review rubric to the complete resulting topic, not only changed paragraphs. The draft PR and final response must include:

- update classification and reason;
- claims checked or changed and their current sources/access dates;
- the meaning of each date, stability, or interval change;
- story, interaction, recap, and quiz consequences reviewed;
- audience and privacy outcome;
- every changed file;
- commands expected and actual CI result;
- unresolved uncertainty or blocked work; and
- the statement that factual, pedagogical, Slovenian-language, privacy, and merge review remain human responsibilities.

Cloud Work may correct CI failures only on its own branch, after write approval, and within the allowed paths. It stops after returning the draft PR for human review.
