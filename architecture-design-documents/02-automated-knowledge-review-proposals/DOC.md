# Design Document: Automated Knowledge-Review Proposals

| Field | Value |
|-------|-------|
| **Status** | Draft |
| **Author** | Jernej and Codex |
| **Created** | 2026-09-09 |
| **Last Updated** | 2026-09-09 |
| **Epic** | — |
| **Related Issues** | — |

---

## 1. Overview

### 1.1 Problem Statement

The existing knowledge-maintenance workflow deterministically identifies stale
published topics and maintains the `Knowledge review due` GitHub Issue. It does
not research sources, update topic content, advance `last_verified`, or create a
reviewable change. A parent must currently perform every step after a topic
appears in the queue.

That boundary is appropriate for V1, but it leaves recurring factual review
mostly manual. The desired extension should research each due topic, prepare the
smallest evidence-backed repository change, and submit it for review without
allowing unattended publication of child-facing educational content.

### 1.2 Proposed Solution

Add a post-V1 ChatGPT Scheduled Task that runs in the cloud and uses the GitHub
plugin plus web research. On each run it:

1. reads the deterministic `Knowledge review due` issue from the default branch;
2. selects the oldest due topic without an existing automation proposal;
3. reads the topic story, quiz, authoring/updating contracts, and cited sources;
4. verifies important claims against current authoritative sources;
5. either updates verification metadata only or updates the complete story and
   quiz as one educational unit;
6. regenerates `review-feed.json` consistently with the proposed topic metadata;
7. creates one branch and one **draft** pull request for the topic;
8. lets the existing GitHub Actions validation workflow evaluate the proposal;
9. reports insufficient evidence or tool failures on the review issue without
   changing repository content; and
10. leaves review, merge, and publication to a human.

### 1.3 Terminology

| Term | Definition |
|------|------------|
| **Review proposal** | A draft pull request prepared by the scheduled task for one due topic. |
| **Verification-only proposal** | A proposal that changes `last_verified` and `review-feed.json` because current sources still support the story. |
| **Content-update proposal** | A proposal that changes the story and/or quiz, advances `last_updated` and `last_verified`, and regenerates the review feed. |
| **Blocked review** | A due topic for which the task cannot obtain sufficient evidence or cannot safely prepare a valid proposal. |
| **Proposal fingerprint** | Stable marker composed of topic slug and the topic's current `last_verified` date, used to prevent duplicate proposals. |
| **Human publication gate** | The requirement that a person reviews and merges a proposal before GitHub Pages can publish it. |

## 2. Architecture

### 2.1 Current Flow

```text
review-due.yml (daily at 06:15 UTC)
  → read review-feed.json
  → calculate due topics deterministically
  → create/update Knowledge review due issue
  → parent researches topic manually
  → parent updates files and opens PR manually
  → validate.yml
  → human merge
  → deploy.yml
```

### 2.2 Proposed Flow

```text
review-due.yml (daily at 06:15 UTC)              # unchanged
  → create/update Knowledge review due issue     # unchanged

ChatGPT Scheduled Task (daily, after queue run)  # NEW
  → use GitHub plugin to read due issue
  → select oldest unclaimed due topic
  → check for matching proposal fingerprint
  → read topic + quiz + repository contracts
  → research authoritative current sources
  → classify result
      ├─ verified, no factual change
      │    → update last_verified + review-feed.json
      ├─ meaningful factual change
      │    → update story + interactions + quiz as needed
      │    → update last_updated + last_verified + review-feed.json
      └─ insufficient evidence or unsafe/tool failure
           → comment once on due issue; make no repository change
  → create one topic branch and draft PR
  → validate.yml evaluates the branch
  → parent reviews evidence and diff
  → human merge                               # REQUIRED
  → deploy.yml publishes
  → next review-due.yml run removes topic from queue
```

Key differences:

- Research and proposal preparation become unattended, but publication does not.
- The existing deterministic GitHub workflow remains the authority for due status.
- Each scheduled run handles at most one topic, bounding cost and review volume.
- GitHub stores all durable state: queue issue, proposal branch, draft PR, CI
  result, comments, and merged history.
- No OpenAI API key is stored in the repository; the task uses the connected
  ChatGPT account and authorized GitHub plugin.

## 3. Impacted Modules

| Module | Change |
|--------|--------|
| ChatGPT Scheduled Tasks | Add a daily cloud task with a durable, repository-backed prompt and narrow permissions. |
| GitHub plugin | Read repository files/issues/PRs; create a topic branch, commits, issue comments, and draft PRs. Never merge. |
| `docs/` | Add the complete topic-updating contract and the scheduled-task setup/runbook. |
| `review-feed.json` | Remains generated data; every proposal that advances `last_verified` must update it. |
| `.github/workflows/validate.yml` | Remains the authoritative executable validation gate for generated proposals. |
| `.github/workflows/review-due.yml` | Remains the deterministic queue owner; wording may acknowledge automated proposals. |
| `README.md` | Document the optional automation and required human merge gate. |

## 4. Scheduled Task Contract

### 4.1 Runtime and Trigger

The task runs once daily after the 06:15 UTC GitHub queue workflow. It is a
standalone cloud task, so the parent's computer does not need to remain on. It
uses the GitHub plugin for repository access and web research for current
sources.

Each run processes the oldest due topic for which no open or previously rejected
proposal has the same fingerprint. Processing one topic per run prevents a stale
queue from generating many simultaneous PRs and bounds research cost.

### 4.2 Versioned Instructions

The durable scheduled-task prompt must instruct ChatGPT to read these files from
the default branch before acting:

```text
docs/topic-authoring.md
docs/topic-updating.md
docs/automated-topic-review.md
src/content/topics/<slug>/index.mdx
src/content/topics/<slug>/quiz.json
review-feed.json
```

`docs/automated-topic-review.md` is the versioned operational contract. The
external scheduled-task prompt should contain only the schedule, repository,
permission boundary, and instruction to follow that file. Updating the workflow
therefore requires a reviewed repository change instead of editing a hidden
prompt in ChatGPT.

### 4.3 Selection and Deduplication

The task reads the open issue titled `Knowledge review due` with label
`knowledge-review`. It selects the first checkbox entry, which is already ordered
by due date and slug, after excluding topics with a matching proposal marker.

Every draft PR and blocked-review comment includes:

```text
<!-- knowledge-review-proposal:<slug>:<last_verified> -->
```

Before changing anything, the task searches open and closed PRs and issue
comments for that exact marker:

- an open draft PR means work is already awaiting review, so the run exits;
- a merged PR means the queue is temporarily stale, so the run exits;
- a closed unmerged PR means the parent rejected that proposal, so automatic
  retries stop for that fingerprint;
- a matching blocked comment prevents repeated daily comments;
- a new `last_verified` value creates a new fingerprint and permits a future
  review cycle.

A parent may manually ask ChatGPT Work to retry a rejected or blocked topic; that
manual action is outside the scheduled deduplication rule.

## 5. Research and Update Behaviour

### 5.1 Evidence Rules

The task follows the source order in `docs/design-v1.md` and prefers 3–8 strong
sources. Important claims must be traceable to the sources listed in the draft
PR. A source being reachable is not evidence that the claim remains true.

The task must not advance `last_verified` when:

- authoritative sources conflict and the story cannot state the uncertainty
  accurately;
- important claims cannot be verified;
- the available GitHub/plugin permissions cannot produce the complete proposal;
- the task cannot inspect both the story and quiz; or
- repository validation reports a failure the task cannot safely correct.

### 5.2 Verification-Only Proposal

When current evidence supports the complete educational unit without content
changes, the task:

1. changes only `last_verified` in the topic frontmatter;
2. preserves `last_updated`;
3. regenerates the matching entry in `review-feed.json`; and
4. opens a draft PR summarizing the sources checked and the no-change verdict.

### 5.3 Content-Update Proposal

When evidence shows a meaningful factual development, the task reviews the whole
topic and changes every affected surface:

- narrative explanation;
- prediction, reveal, choice, and think interactions;
- visuals and experiments;
- parent notes and uncertainty language;
- key facts;
- quiz questions and explanations; and
- educational change history where the change itself is useful to understand.

It advances both `last_updated` and `last_verified` to the UTC review date and
regenerates `review-feed.json`. Unaffected content should not be reformatted or
rewritten.

### 5.4 Pull Request Contract

The task creates a branch named:

```text
automation/review-<slug>-<YYYY-MM-DD>
```

The pull request is always a draft and contains:

- the proposal fingerprint;
- verification-only or content-update classification;
- sources checked and access date;
- concise claim-by-claim findings;
- files changed and educational consequences;
- unresolved uncertainty or caveats;
- expected `validate.yml` result; and
- an explicit statement that human review and merge are required.

The task may respond to CI failures by pushing narrowly scoped corrections to
its own proposal branch. It must not approve, mark ready, merge, close, or deploy
the PR.

## 6. Permissions and Safety

The GitHub plugin must be restricted to this repository and granted only the
capabilities needed to read content, create branches/commits, open draft PRs, and
comment on the knowledge-review issue. The task must not:

- push to `main`;
- merge or approve pull requests;
- edit GitHub Actions workflows, application code, dependencies, or repository
  settings;
- delete branches, issues, releases, or content;
- modify any topic other than the selected slug;
- publish content directly;
- copy child names, profiles, learning history, or other personal data into
  prompts, sources, commits, or PRs; or
- treat model output as evidence without checking authoritative external sources.

The first implementation gate is a capability smoke test confirming that the
installed GitHub plugin can create a branch, commit the permitted files, and
open a draft PR. If those actions are unavailable, implementation stops and the
fallback design is GitHub Actions plus an explicitly managed OpenAI API secret;
the safety and human-merge boundaries remain unchanged.

## 7. Validation and Human Review

The web scheduled task does not have a persistent local checkout, so GitHub
Actions is the executable validation authority. Opening the draft PR triggers:

```text
npm run validate
npm test
npm run test:root-build
npm run test:subpath
```

The parent reviews both evidence and implementation. A green CI result proves
schema/build correctness, not factual or pedagogical quality. The parent checks:

1. whether sources support the findings;
2. whether Slovenian wording is clear and age appropriate;
3. whether simplifications and uncertainty are honest;
4. whether all affected interactions and quiz questions were updated; and
5. whether metadata dates and review interval are appropriate.

Only the parent may mark the PR ready and merge it. The normal deployment
workflow then publishes the merged content. The next queue run removes the topic
because the committed `last_verified` and review feed have advanced.

## 8. Edge Cases & Behaviour

1. **No due issue or no due entries:** The task makes no changes and reports a
   no-op in its scheduled run result.
2. **Queue workflow is late or failed:** The task does not independently invent
   due status. It reports that the deterministic queue is unavailable and exits.
3. **Existing proposal:** The task finds the fingerprint and exits without a
   duplicate branch, PR, or comment.
4. **Closed unmerged proposal:** Automatic retries remain suppressed for that
   fingerprint. A parent can request a manual retry.
5. **Insufficient or conflicting evidence:** The task posts one marker-bearing
   comment explaining the blocker and leaves the topic due.
6. **Source URL is unavailable:** The task seeks another authoritative source.
   If the important claim remains unverifiable, it follows the blocked path.
7. **Factual change affects quiz logic:** The task updates the story and quiz in
   the same proposal; partial factual patches are not allowed.
8. **Generated review feed differs unexpectedly:** The task changes only the
   selected topic's feed entry. Any unrelated difference blocks the proposal.
9. **CI fails:** The draft PR remains unmerged. The task may correct only its own
   topic/feed changes; otherwise it reports the failure for human action.
10. **Base branch changes during research:** The task refreshes repository state
    before committing and rechecks the fingerprint. Conflicts block the proposal.
11. **Multiple due topics:** Only the oldest unclaimed topic is processed; later
    daily runs drain the remaining queue.
12. **Human edits the proposal:** The task does not overwrite human commits. Any
    further automated correction must preserve or explicitly report them.

## 9. User Stories / Journeys

**US-1:** As a parent, when a topic is due but still accurate, I receive a draft
verification-only PR with reviewed sources, so that I can approve a new
`last_verified` date without doing the research from scratch.
**Acceptance test:** scheduled-task smoke test with a stable, unchanged topic.

**US-2:** As a parent, when authoritative facts changed, I receive one draft PR
that updates every affected part of the story and quiz, so that I can review the
educational unit coherently.
**Acceptance test:** scheduled-task smoke test with a controlled changed-source fixture.

**US-3:** As a parent, when evidence is insufficient, I see one actionable issue
comment and no content change, so that uncertainty is never converted into a
false verification date.
**Acceptance test:** scheduled-task smoke test with an unavailable/contradictory source fixture.

**US-4:** As a maintainer, repeated scheduled runs do not create duplicate PRs or
comments for the same topic review cycle.
**Acceptance test:** repeat US-1 and US-3 using the same proposal fingerprints.

**US-5:** As a parent, merging an approved proposal removes the topic from the
next deterministic review queue.
**Acceptance test:** end-to-end test from draft PR merge through manual queue dispatch.

**US-6:** As a maintainer, a failing generated proposal remains a draft and is
never published automatically.
**Acceptance test:** scheduled-task smoke test with intentionally invalid topic output.

## 10. Decisions Made

1. **ChatGPT Scheduled Task with GitHub plugin:** Use the cloud scheduled-task
   environment instead of a desktop task or GitHub Actions API client. This
   avoids storing an OpenAI API key and does not require the parent's computer
   to stay on. The trade-off is dependency on eligible ChatGPT plan and plugin
   capabilities.
2. **One topic per run:** Process the oldest unclaimed topic to bound cost and
   prevent a burst of draft PRs.
3. **One draft PR per topic:** Keep evidence, content changes, CI, and human
   approval independently reviewable.
4. **Human merge is mandatory:** Automation may research, edit, and propose but
   may never approve, merge, or publish child-facing content.
5. **Existing queue remains authoritative:** The scheduled task consumes the
   GitHub Issue instead of duplicating review-date mechanics in model reasoning.
6. **GitHub stores durable state:** PRs, comments, and fingerprints make retries
   and deduplication auditable without adding a database.
7. **Verification-only changes use a PR:** Even a metadata-only verification is
   reviewable and cannot silently remove a topic from the queue.
8. **Blocked runs do not mutate content:** Lack of evidence or validation is a
   reportable state, never grounds for advancing `last_verified`.
9. **Repository-backed operational contract:** Store detailed instructions in
   `docs/automated-topic-review.md`; keep the external task prompt minimal.
10. **CI is necessary but not sufficient:** GitHub Actions checks structure and
    behavior; the parent separately approves factual and pedagogical quality.

## 11. Upgrade Paths

### 11.1 Parallel review proposals

After cost and review quality are understood, the task could process a
configurable number of topics per run. V1 of the extension remains serial.

### 11.2 Hosted GitHub Actions agent

If GitHub plugin write capabilities or scheduled-task availability are
insufficient, a GitHub Actions workflow could invoke an OpenAI API-backed agent.
That requires secret management, usage limits, and additional prompt-injection
controls and is therefore a fallback rather than the initial design.

### 11.3 Automatic merge for verification-only proposals

Metadata-only proposals could theoretically auto-merge after green CI. This is
deferred because advancing `last_verified` asserts that a human-reviewable
factual check occurred; the initial extension preserves the same human gate for
all proposal types.

### 11.4 Source-health monitoring

Independent link and source-health checks could run more frequently than full
topic reviews. They should report broken or redirected sources without treating
link availability as factual verification.

## 12. Implementation Plan

```text
Task 1: topic-updating contract
  ↓
Task 2: automated-review contract + task prompt
  ↓
Task 3: GitHub plugin capability and safety smoke test
  ↓
Task 4: scheduled task + unchanged-topic acceptance run
  ↓
Task 5: changed/blocked/deduplication acceptance runs + documentation
```

1. **Define topic updates** (`docs/topic-updating.md`). Specify evidence,
   full-unit review, metadata semantics, source reporting, and human checks.
2. **Define automation operations** (`docs/automated-topic-review.md`). Add the
   durable prompt, fingerprint format, allowed file scope, PR template, failure
   reporting, and setup instructions.
3. **Verify GitHub plugin capabilities.** On a disposable test branch, confirm
   permitted reads, branch/commit creation, draft PR creation, issue comments,
   and inability/instruction not to merge. Remove or close the test artifacts
   after review.
4. **Create and test the scheduled task.** Run one stable unchanged-topic case,
   validate the draft PR and CI behavior, then confirm human-only merge.
5. **Exercise failure and change paths.** Test a controlled factual change,
   unavailable/conflicting evidence, repeated execution, and post-merge queue
   removal. Update README and operational documentation with observed behavior.

## 13. Files

| File | Change |
|------|--------|
| `architecture-design-documents/02-automated-knowledge-review-proposals/DOC.md` | Canonical feature design. |
| `docs/design-v1.md` | Add the post-V1 automation extension and roadmap milestone. |
| `docs/topic-updating.md` | New manual and automated topic-update contract. |
| `docs/automated-topic-review.md` | New scheduled-task prompt, setup, safety, and recovery runbook. |
| `.github/workflows/review-due.yml` | Optional wording update after automation is enabled. |
| `README.md` | Document automated draft proposals and the human publication gate. |

## 14. Changelog

No changes after initial draft.
