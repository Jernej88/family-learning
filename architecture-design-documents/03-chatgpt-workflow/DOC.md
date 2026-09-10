# Design Document: Milestone 8 — ChatGPT Workflow and Topic Audiences

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Author** | Jernej and Codex |
| **Created** | 2026-09-09 |
| **Last Updated** | 2026-09-09 |
| **Epic** | — |
| **Related Issues** | — |

---

## 1. Overview

### 1.1 Problem Statement

The repository has a working topic bundle, schemas, deterministic validation,
CI, deployment, and knowledge-review queue. `docs/topic-authoring.md` describes
the file contract, but it is not yet a complete remote authoring workflow. It
does not tell ChatGPT Work how to inspect the repository, decide when to ask a
question, create a branch and draft pull request, respond to validation results,
or stop for human review. `docs/topic-updating.md` does not exist.

The product also assumes that every topic is written for a child. The planned
LEGO SPIKE topic fits that model, but a practical topic about planning a pergola
or carport is useful primarily to an adult. Using ordinary free-form tags for
this distinction would not give schemas, authors, the UI, or child learning
history one consistent rule to follow.

Milestone 8 must make parent-initiated authoring repeatable in ChatGPT Work in
the cloud while preserving Git as the source of truth and a human merge as the
publication gate. It must also support clearly labeled adult topics that remain
safe to show in a family application but need not be understandable to a child.

### 1.2 Proposed Solution

1. Add an explicit `audience: child | adult` topic field. Both audiences remain
   public and use the same interactive-story and 15–30-question quiz contract.
2. Require age-range metadata for child topics and omit it from adult topics.
3. Present child and adult topics in separate, visible homepage sections and
   label the audience on cards and topic pages.
4. Keep adult topics out of child profile completion and daily recall while
   leaving their standalone quizzes playable.
5. Add a versioned ChatGPT Work runbook and refine the authoring and updating
   contracts.
6. Use the GitHub plugin in cloud Work, authorized only for this repository,
   to create one branch and draft pull request per parent-initiated topic.
7. Prove the workflow with the existing Moon topic as the reference plus one
   new child topic about LEGO SPIKE and one new adult topic about the Slovenian
   pergola/carport planning process.

This milestone does not add scheduled authoring, automatic merging, runtime AI,
an OpenAI API key, or the Milestone 9 automated knowledge-review workflow.

### 1.3 Terminology

| Term | Definition |
|------|------------|
| **Audience** | The intended reading level and authoring contract of a topic; either `child` or `adult`. It is not an access-control setting. |
| **Child topic** | A child-readable interactive story with a recommended age range. Parents and other adults may also read it. |
| **Adult topic** | A public, family-safe topic written for an adult reader; it may contain technical, legal, or procedural detail unsuitable for a child reading level. |
| **Topic tag** | A free-form subject label such as `robotika` or `gradnja`; it does not control audience behavior. |
| **Remote authoring run** | One parent-initiated ChatGPT Work cloud task that researches a question and proposes a topic in GitHub. |
| **Publication gate** | The required human review and merge of a draft pull request before deployment. |
| **Workflow acceptance run** | A recorded end-to-end trial used to judge generated structure, content quality, validation, and handoff behavior. |

## 2. Architecture

### 2.1 Current Flow

```text
Parent asks a question
  → author interprets docs/topic-authoring.md manually
  → author prepares index.mdx + quiz.json
  → files are applied to a local checkout
  → npm run validate + npm test + build checks
  → pull request
  → human merge
  → deploy.yml publishes

All published topics
  → one undifferentiated homepage grid
  → child profile may mark any topic learned
  → quiz results may enter child question history
  → daily recall considers every learned published topic
```

### 2.2 Proposed Flow

```text
Parent asks ChatGPT Work for a topic and identifies/accepts its audience
  → Work reads repository-backed authoring instructions          # NEW
  → Work uses web research and the repository-scoped GitHub plugin
  → Work asks focused questions if claims depend on missing facts # NEW
  → Work creates content/<slug>-<date> from main                  # NEW
  → Work writes index.mdx + quiz.json and regenerates review feed
  → Work opens a draft pull request                               # NEW
  → validate.yml runs the complete repository checks
  → Work may correct only its topic proposal after approval
  → parent reviews facts, Slovenian, pedagogy, audience, and diff
  → human merge                                                   # REQUIRED
  → deploy.yml publishes

Published topics
  → homepage groups child topics before adult topics              # CHANGED
  → cards and topic heroes show an audience label                 # NEW
  → child topic: completion + profile history + daily recall
  → adult topic: standalone story + quiz, no child progress       # NEW
```

Key differences:

- Audience is structured metadata with behavioral meaning, not a conventional
  tag and not a visibility restriction.
- Detailed workflow instructions live in Git and are reviewed like code.
- The cloud workflow writes only to a topic branch and opens a draft PR.
- CI proves repository correctness; a human separately approves factual and
  pedagogical quality.
- Adult content never silently enters a child's spaced-repetition queue.

## 3. Content and Schema Design

### 3.1 Topic Audience

Add a required discriminating field to topic frontmatter:

```yaml
audience: child # child | adult
```

Child topics require the existing age range:

```yaml
audience: child
recommended_age_min: 7
recommended_age_max: 12
```

Adult topics omit both age-range fields:

```yaml
audience: adult
```

`topicSchema` becomes a discriminated union over `audience`. Shared metadata,
date ordering, sources, status, and stability rules apply to both branches.
Only the child branch accepts and validates `recommended_age_min` and
`recommended_age_max`.

The existing Moon topic is migrated explicitly to `audience: child`. There is
no implicit default: missing audience metadata fails validation so authors must
make a conscious choice.

### 3.2 Shared Story Contract

Both audiences retain the same published-story structural requirements:

- a self-contained `index.mdx` and `quiz.json` bundle;
- at least three meaningful interactions before `KeyFacts`;
- a `KeyFacts` recap;
- a `ParentNote`, whose `title` may be overridden for an adult topic (for
  example, `Pravna opomba` or `Pred izvedbo`);
- 15–30 quiz questions with explanations;
- 3–8 strong sources as the authoring target, within the schema's eight-source
  maximum; and
- factual-review metadata and human review before merge.

Adult quiz questions retain the current `age_min` field and set it to `18`.
This avoids a second quiz format. The value does not expose the question to a
child profile because adult topics are excluded from profile completion and
daily recall at the topic level.

### 3.3 Audience-Specific Editorial Rules

Child topics must use age-appropriate Slovenian, explain unfamiliar vocabulary,
integrate interactions into the explanation, avoid unnecessary cognitive load,
and treat parents as optional co-learners.

Adult topics may use professional vocabulary and more detailed procedures, but
must remain safe to display publicly beside child content. They must explain
consequences, uncertainty, and when an authoritative professional or public
body must make the real decision. They must not contain household addresses,
parcel identifiers, private documents, names, or personalized legal conclusions.

### 3.4 Legal and Other High-Stakes Topics

An adult topic may explain a current process but cannot promise an exact result
where the answer depends on facts not stored in the public repository. The
pergola/carport trial therefore covers Slovenia-wide concepts and the procedure
for checking the applicable municipal spatial act, structure classification,
dimensions, setbacks, consents, and permit requirements.

It must clearly distinguish a pergola from a roofed carport and separate:

- generally applicable national rules;
- municipality- or spatial-plan-dependent rules;
- property-specific facts that the reader must verify privately; and
- steps that require confirmation from a municipality, administrative unit,
  licensed designer, surveyor, utility operator, or other competent party.

If the request asks ChatGPT to decide legality for one specific property, the
workflow stops and explains that the property-specific work is a separate,
private deliverable outside this repository.

## 4. Application Behaviour

### 4.1 Topic Library

The homepage renders two server-generated sections:

1. `Za otroke` — child topics, shown first.
2. `Za odrasle` — adult topics, shown second.

Both sections are visible without a profile or gate. Empty sections are omitted.
A client-side filter is unnecessary for the initial three-topic library and is
deferred until topic volume justifies it.

Every topic card shows a localized audience label in addition to category and
estimated reading time. The homepage introduction is broadened so it does not
claim that all topics are written for children.

### 4.2 Topic Page

The topic hero shows `Za otroke` and the recommended range for a child topic.
It shows `Za odrasle` without an artificial age range for an adult topic.

Both audiences render the same MDX components, sources, factual verification
date, and quiz player.

### 4.3 Profiles and Recall

Child profile semantics remain unchanged for child topics. For adult topics:

- `TopicCompletion` is not rendered;
- the quiz remains playable without writing question results to an active child
  profile;
- the review page does not load adult-topic questions; and
- existing quiz-session persistence may retain in-progress standalone quiz
  state, because it is keyed by topic rather than by child profile.

No learning-state schema migration or adult profile type is introduced.

## 5. ChatGPT Work Remote Authoring

### 5.1 Required Setup

The GitHub plugin is installed in the same ChatGPT account/workspace that runs
ChatGPT Work. Its GitHub connection is authorized for only
`Jernej88/family-learning`. The connection must support repository reads,
branch and commit creation, draft pull requests, pull-request/check reads, and
no other repository.

ChatGPT's plugin-specific permission mode should allow reads and ask before
writes. GitHub branch protection or a repository ruleset must require pull
requests for `main`; a prompt instruction alone is not a security boundary.
The workflow never requests merge, approval, force-push, branch deletion,
settings, Actions workflow, secrets, or release permissions.

### 5.2 Capability Gate

Before authoring a real topic, a disposable smoke test confirms the connected
plugin can:

1. read the default branch and the required contracts;
2. create a uniquely named branch from the current `main`;
3. create or modify an allowed test file on that branch;
4. open a draft pull request;
5. read the resulting CI/check status; and
6. leave `main` and every other repository untouched.

The test artifact is closed and its branch is removed manually after review.
If any required write or check-read action is unavailable, cloud GitHub
authoring is blocked. The fallback is ChatGPT Work locally in the repository or
Codex applying the generated bundle; Milestone 8 does not add API automation.

### 5.3 Versioned Work Prompt

Add `docs/chatgpt-workflow.md` as the human runbook and remote Work entry point.
The external prompt remains short and points to repository-owned instructions:

```text
Use the GitHub plugin only with Jernej88/family-learning. Follow
docs/chatgpt-workflow.md and docs/topic-authoring.md from main to research and
propose a new <audience> topic for: <question>. Create a new branch and a draft
pull request. Never push to main, merge, or modify files outside the allowed
topic bundle and generated review-feed.json. Stop for my review.
```

The runbook requires Work to read, at minimum:

```text
README.md
docs/design-v1.md (source policy and relevant topic lifecycle sections)
docs/topic-authoring.md
docs/topic-updating.md when modifying an existing topic
src/lib/content-schema.ts
src/lib/content-validation.ts
one relevant existing topic bundle
```

### 5.4 Branch, File, and Pull-Request Contract

One parent request produces one branch:

```text
content/<slug>-<YYYYMMDD>
```

Allowed content-authoring changes are:

```text
src/content/topics/<slug>/index.mdx
src/content/topics/<slug>/quiz.json
src/content/topics/<slug>/<required assets>
review-feed.json
```

The topic is set to `published` in the draft PR so the strongest validation
rules run before merge. “Published” describes the state after merge; the draft
PR remains the human publication gate.

The PR body records:

- original question and chosen audience;
- story objective and key concepts;
- sources used and access date;
- important simplifications or uncertainty;
- files changed;
- expected validation commands and observed CI result; and
- a statement that factual, pedagogical, Slovenian-language, and merge review
  remain human responsibilities.

Work may correct CI failures on its own branch after write approval. It must not
broaden the change into application code or workflow configuration. If the
topic cannot pass without such a change, it reports the limitation and stops.

## 6. Authoring and Updating Contracts

### 6.1 `docs/topic-authoring.md`

Refine the existing document with:

- audience selection and audience-specific editorial rules;
- a preflight checklist of repository files to read;
- conditions requiring a focused question before research;
- source selection and claim-tracing guidance;
- a story-outline step before writing MDX;
- exact allowed output paths and branch/PR behavior;
- generated-feed handling;
- a self-review rubric for narrative coherence, interaction quality, quiz
  coverage, Slovenian clarity, factual support, and privacy;
- the complete validation/CI command set; and
- a final response format that links the draft PR and lists unresolved issues.

### 6.2 `docs/topic-updating.md`

Add the missing update contract. An update treats the story and quiz as one
educational unit, changes only affected content, distinguishes
`last_updated` from `last_verified`, regenerates the review feed, and requires
the same audience and privacy checks as new content.

Verification-only, factual-change, and audience-reclassification updates are
described separately. Changing a topic's audience requires reviewing its prose,
age metadata, profile/recall behavior, interactions, quiz wording, and card
presentation rather than changing one frontmatter value alone.

### 6.3 Human Review Rubric

Automated checks establish structural correctness. A reviewer separately marks
each acceptance run pass/fail for:

- correct audience classification;
- factual claims supported by authoritative sources;
- appropriate Slovenian and reading level;
- coherent narrative or procedure;
- meaningful rather than decorative interactions;
- quiz coverage of the important concepts;
- transparent uncertainty and high-stakes boundaries;
- absence of personal data; and
- a surgical repository diff.

## 7. Workflow Acceptance Trials

### 7.1 Reference Trial — Moon

Use `Zakaj Luna ne pade na Zemljo?` as the gold-standard child topic. Review it
against the revised contract and add only the required `audience: child`
metadata. It establishes the expected rhythm, component use, source quality,
and quiz shape; the workflow must not rewrite it merely for stylistic novelty.

### 7.2 Child Trial — LEGO SPIKE

Question:

> What are some good ways for a kid to learn robotics and programming
> independently or with my help and using a LEGO SPIKE set?

Create a child topic in Slovenian about safe, progressive learning with LEGO
Education SPIKE. It should distinguish independent activities from supported
parent-child activities, propose concrete projects, teach a debugging mindset,
avoid presenting product marketing as educational evidence, and use current
official LEGO Education documentation plus independent educational sources.

The workflow should ask which SPIKE set and the child's approximate age if the
answer would materially change projects or software instructions. No child's
name or identifying information is stored.

### 7.3 Adult Trial — Pergola or Carport

Question:

> What permits are needed and what is the exact procedure to add a pergola or
> a car roof in the immediate vicinity of my house, and how should I implement
> this project?

Create an adult topic in Slovenian. The durable public topic explains the
Slovenian process, classification-dependent branches, official sources,
professional roles, safe implementation sequence, and questions the reader
must resolve locally. It must use the standard interactive components and quiz,
but it must not assert a property-specific permit outcome or contain private
property data.

Because laws, subordinate rules, and municipal spatial acts can change, the
topic uses `stability: changing` and a deliberately short review interval chosen
during research.

### 7.4 Passing the Milestone

All three retained topics must:

- pass `npm run validate`, `npm test`, `npm run test:root-build`, and
  `npm run test:subpath`;
- pass the human review rubric;
- render under the correct homepage section and topic-page label;
- preserve child recall isolation; and
- arrive through a reviewable draft PR without manual file restructuring.

Factual or language corrections during review are expected and do not fail the
workflow. Moving files, rebuilding the MDX structure, replacing an invalid quiz
shape, or manually repairing routine schema errors does fail the first-pass
workflow criterion and triggers a contract revision before the next trial.

## 8. Edge Cases and Behaviour

1. **Missing audience:** Validation fails. The author must explicitly choose
   `child` or `adult`.
2. **Ambiguous audience:** Work asks the parent before creating files. It does
   not infer from subject alone; robotics can be either audience depending on
   the requested outcome.
3. **Adult topic with child ages:** Validation rejects the inapplicable topic
   age-range fields. Adult quiz questions still use `age_min: 18` under the
   shared quiz contract.
4. **Child topic without ages:** Validation fails with paths identifying both
   required fields.
5. **Adult topic opened with a child profile active:** The story and quiz work,
   but completion controls are absent and answers do not mutate the child's
   question history.
6. **High-stakes request lacks jurisdiction or project facts:** Work asks a
   focused question or narrows the public topic to a general decision process;
   it never invents an exact legal conclusion.
7. **Private property details are offered:** They may inform a private
   conversation only when appropriate and must not be copied into repository
   files, commits, or the PR. The public topic remains generalized.
8. **GitHub plugin cannot perform a required action:** The run stops at the
   capability gate and uses the documented local/Codex fallback.
9. **Plugin attempts a write outside the allowed branch or files:** The parent
   denies the action. The run is failed and the permission/runbook setup is
   corrected before another trial.
10. **CI fails:** Work may repair only its own topic and generated feed. A
    required application-code change becomes a separately reviewed task.
11. **Sources disagree:** The topic states material uncertainty or stops as
    blocked; `last_verified` is not used to imply certainty.
12. **One audience section is empty:** The homepage omits that section without
    displaying an empty-state card.
13. **Existing local learning state:** No migration is needed because audience
    is repository metadata and the learning-state JSON format does not change.

## 9. User Stories / Journeys

**US-1:** As a child or parent, I can immediately tell which topics are written
for children and which are written for adults, while still being able to open
either kind.
**Acceptance test:** root/subpath build inspection for grouped topic cards and
audience labels.

**US-2:** As a child with an active profile, reading or trying an adult topic
does not add adult material to my progress or daily recall.
**Acceptance test:** component and review-catalog tests for adult-topic history
isolation.

**US-3:** As a parent, I can ask ChatGPT Work in the cloud for a child topic and
receive a structurally valid draft PR without manually rearranging its files.
**Acceptance test:** LEGO SPIKE workflow acceptance run.

**US-4:** As a parent, I can ask for an adult practical topic and receive a
family-safe, source-backed, clearly bounded learning story and quiz.
**Acceptance test:** pergola/carport workflow acceptance run.

**US-5:** As a maintainer, I can update either audience using a versioned
contract that keeps the story, interactions, quiz, sources, and metadata
consistent.
**Acceptance test:** Moon contract review plus a controlled metadata update.

**US-6:** As the repository owner, I retain final control over every generated
topic because cloud Work can propose a draft PR but cannot bypass the protected
`main` branch or merge it.
**Acceptance test:** GitHub plugin capability and branch-protection smoke test.

## 10. Decisions Made

1. **Explicit audience field:** Use `audience: child | adult` rather than
   free-form audience tags. Structured metadata gives schemas and UI one stable
   contract.
2. **Audience is not access control:** Both kinds remain public and browsable.
   Labels set reader expectations; there is no login or parental gate.
3. **Shared story and quiz contract:** Both audiences keep meaningful
   interactions, recap, caveat note, sources, and 15–30 quiz questions. This
   preserves one content pipeline and will be reconsidered only after real use.
4. **Conditional topic ages:** Child topics require a recommended range; adult
   topics omit it rather than displaying an artificial age.
5. **Adult quiz compatibility:** Adult questions use `age_min: 18`, while the
   topic audience prevents them from entering child recall.
6. **No adult learning profile in Milestone 8:** Adult topics have standalone
   quizzes but no profile completion or spaced repetition. Adding adult progress
   would require a separate product decision and storage migration.
7. **Grouped library before filters:** Render two visible server-side sections.
   A filter is unnecessary for three topics.
8. **Cloud Work with GitHub plugin:** Use the connected ChatGPT account instead
   of an OpenAI API integration. The plugin is repository-scoped and every
   write requires approval.
9. **One draft PR per topic:** Isolate factual and pedagogical review and avoid
   coupling unrelated new topics.
10. **Protected human publication gate:** CI plus a human merge is mandatory;
    model output is never published directly.
11. **Versioned instructions:** Store the operational prompt and contracts in
    Git so workflow changes are reviewable.
12. **Three retained topics:** The Moon reference, LEGO SPIKE child topic, and
    Slovenia pergola/carport adult topic are the Milestone 8 acceptance set.
13. **No personalized legal content in Git:** The adult legal topic teaches the
    verification procedure and boundaries but does not decide one property's
    legality.

## 11. Upgrade Paths

### 11.1 Adult profiles and recall

Add an adult profile type, profile-aware topic completion, and spaced recall for
adult topics if adults actually use the quizzes repeatedly. This is deferred to
avoid a learning-state migration before usage demonstrates value.

### 11.2 Audience filters and preferences

Add `Vse`, `Za otroke`, and `Za odrasle` controls or remember a preferred
library view when the topic count makes two visible sections cumbersome.

### 11.3 Audience-specific components or quiz sizes

Adult practical guides could gain checklist, decision-tree, or project-plan
components and shorter optional quizzes. Milestone 8 first tests whether the
shared interaction system is sufficient.

### 11.4 More audience values

Values such as `family` or `professional` can be considered after repeated
classification problems. They are not added speculatively.

### 11.5 Automated knowledge-review proposals

Scheduled research and batched draft PRs remain Milestone 9 and follow
`02-automated-knowledge-review-proposals`. Parent-initiated authoring in this
milestone does not consume or automate the due-topic issue.

## 12. Implementation Plan

```text
Task 1: audience schema and application behavior
  ↓
Task 2: remote GitHub capability gate and versioned contracts
  ↓
Task 3: LEGO SPIKE child-topic acceptance run
  ↓
Task 4: pergola/carport adult-topic acceptance run
  ↓
Task 5: cross-topic acceptance, contract refinement, and milestone closeout
```

### Task 1 — Add audience-aware content and application behavior

**Scope:** `src/lib/`, topic collection consumers, topic/card/layout
components, styles, and the Moon topic.

- Add the discriminated child/adult topic schema and tests.
- Add `audience: child` to the Moon topic.
- Group the homepage and add audience labels.
- Render child completion/history only for child topics.
- Exclude adult topics from the daily review input.
- Keep standalone quizzes for both audiences.

**Verify:** schema tests cover both valid branches and invalid age combinations;
learning tests prove adult isolation; all existing checks pass at root and the
GitHub Pages subpath.

### Task 2 — Establish the cloud Work authoring boundary

**Scope:** GitHub connection/ruleset and `docs/` only.

- Restrict the GitHub connection to this repository and require approval for
  writes.
- Require pull requests for `main`.
- Run and document the disposable capability smoke test.
- Add `docs/chatgpt-workflow.md`.
- Refine `docs/topic-authoring.md` and add `docs/topic-updating.md`.
- Record the human review rubric and PR handoff format.

**Verify:** a new cloud Work chat can read the contracts, create a branch and
draft PR, and observe CI without touching `main` or another repository. If it
cannot, document and exercise the local/Codex fallback before proceeding.

### Task 3 — Author and review the LEGO SPIKE child topic

**Scope:** one new topic bundle and generated `review-feed.json` change.

- Run the exact parent question through the versioned remote workflow.
- Resolve set/age ambiguity before selecting projects.
- Research current authoritative and independent educational sources.
- Produce the Slovenian story, interactions, parent guidance, and 15–30
  questions in one draft PR.
- Apply human factual, language, pedagogy, privacy, and diff review.

**Verify:** CI passes without manual restructuring; the topic appears under
`Za otroke`; child profile completion and recall work normally.

### Task 4 — Author and review the pergola/carport adult topic

**Scope:** one new topic bundle and generated `review-feed.json` change.

- Run the parent question with `audience: adult`.
- Scope the durable content to the current Slovenian process and identify every
  municipality/property-dependent branch.
- Research current primary legal and government sources.
- Produce a family-safe Slovenian story, practical sequence, interactions,
  caveats, and 15–30 adult questions in one draft PR.
- Reject any property-specific conclusion or personal data from the diff.

**Verify:** CI and the human high-stakes review pass; the topic appears under
`Za odrasle`; its quiz works but does not mutate child progress or recall.

### Task 5 — Close the acceptance loop

**Scope:** contracts, tests exposed by the trials, and README/design status.

- Compare all three topics against the rubric and record pass/fail results.
- Correct recurring authoring-instruction gaps discovered by the trials.
- Add only validation improvements justified by an observed repeatable failure.
- Run the complete validation suite from a clean checkout.
- Mark this design accepted and update the README/V1 milestone status after the
  two content PRs are reviewed and merged.

**Verify:** all three retained topics meet the automated and human criteria, the
remote workflow requires no manual file restructuring, and the deployed site
clearly separates both audiences.

## 13. Files

| File | Change |
|------|--------|
| `architecture-design-documents/03-chatgpt-workflow/DOC.md` | Canonical Milestone 8 design and task plan. |
| `src/lib/content-schema.ts` | Add discriminated child/adult topic metadata. |
| `src/lib/content-validation.test.ts` | Cover audience and age contract behavior. |
| `src/pages/index.astro` | Group published topics by audience. |
| `src/components/TopicCard.astro` | Display the audience label. |
| `src/layouts/TopicLayout.astro` | Render audience-specific hero metadata. |
| `src/pages/topics/[...slug].astro` | Limit child completion/history behavior to child topics. |
| `src/components/Quiz.astro` | Allow adult quizzes without child-history writes. |
| `src/pages/review.astro` | Exclude adult topics from child daily recall. |
| `src/styles/global.css` | Style audience sections and labels. |
| `src/content/topics/zakaj-luna-ne-pade-na-zemljo/index.mdx` | Mark the reference topic as `child`. |
| `docs/chatgpt-workflow.md` | Add cloud Work setup, prompt, permissions, and handoff runbook. |
| `docs/topic-authoring.md` | Add audiences and executable authoring workflow. |
| `docs/topic-updating.md` | Add whole-topic update contract. |
| `src/content/topics/<lego-spike-slug>/` | New child acceptance topic bundle. |
| `src/content/topics/<pergola-carport-slug>/` | New adult acceptance topic bundle. |
| `review-feed.json` | Regenerated after each published topic addition. |
| `README.md` | Document both audiences and Milestone 8 workflow. |

## 14. Changelog

—

### 14.1 Implementation Slice Ledger

- **`dds-03-chatgpt-workflow-ed24719c370d` — Add audience-aware content and
  application behavior:** Implements Task 1 against the accepted design. The
  slice branches from and targets `milestone-8-chatgpt-workflow` at
  `77acd67c8a587831e46f9e447b124e74f3892880`, with no prerequisite slice and
  the same SHA as its fork point. Acceptance requires valid audience/age schema
  branches, visible audience grouping and labels, adult-topic isolation from
  child progress and recall, complete root/subpath checks, and a clean
  independent review. Tracking: [GitHub issue #10](https://github.com/Jernej88/family-learning/issues/10);
  [pull request #11](https://github.com/Jernej88/family-learning/pull/11).
  Notion tracking was explicitly omitted.
- **`dds-03-chatgpt-workflow-1e6f36266763` — Establish the cloud Work authoring
  boundary:** Implements Task 2 against the accepted design. The slice branches
  from and targets `milestone-8-chatgpt-workflow` at
  `dd3de53cbe0838273ffe8aa93930cace1eb1d6d5`, with no prerequisite slice and
  the same SHA as its fork point. It protects `main`, versions the cloud
  runbook and topic authoring/updating contracts, records the human review
  rubric and handoff, and documents the local/Codex fallback. Acceptance
  requires the approved branch boundary, complete validation, observed CI, and
  a clean independent review. The connector-specific smoke test remains an
  operator-run gate because the connector is unavailable in this session.
  Tracking: [GitHub issue #12](https://github.com/Jernej88/family-learning/issues/12).
  Notion tracking was explicitly omitted.
