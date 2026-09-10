# ChatGPT Work topic workflow

This runbook is the remote entry point for proposing one family-learning topic through ChatGPT Work. Git remains the source of truth, CI proves structural correctness, and a human merge is the publication gate.

## Security boundary

Configure the GitHub connection in the same ChatGPT account or workspace that runs Work:

- authorize only `Jernej88/family-learning`;
- allow repository, pull-request, and check reads;
- ask before every branch, commit, file, or pull-request write; and
- grant no merge, approval, force-push, branch deletion, repository-settings, Actions-workflow, secrets, release, or other-repository authority.

GitHub must protect `main` by requiring pull requests. Protection must apply to administrators and disallow force-pushes and deletion. Connector settings and prompts support that control but do not replace it.

One authoring run may write only:

```text
content/<slug>-<YYYYMMDD>                         # new-topic branch
content/<slug>-update-<YYYYMMDD>                  # update branch
src/content/topics/<slug>/index.mdx
src/content/topics/<slug>/quiz.json
src/content/topics/<slug>/<required-assets>
review-feed.json
```

The run must never push to `main`, merge, approve, alter settings or workflows, delete a branch, or edit application code and unrelated topics.

## Connector capability gate

Cloud authoring is blocked until a disposable smoke test proves the configured connector can do all of the following without touching another repository or branch:

1. Read the default branch, this runbook, `docs/topic-authoring.md`, and the schema and validation files.
2. Create a uniquely named branch from the current `main` head after write approval.
3. Add one uniquely named file under `docs/workflow-smoke-tests/` after write approval. This is the only smoke-test exception to the topic-file boundary.
4. Open a draft pull request after write approval.
5. Read the resulting CI/check status.
6. Stop without merging, closing, deleting, or making any further change.

The owner reviews and manually closes the disposable PR and removes its branch. Record the date, branch, PR, check result, repositories touched, and pass/fail outcome outside permanent topic content. Any unavailable action, unexpected permission, write without approval, or access to another repository fails the gate. Correct the connector or use the fallback before attempting a topic.

The connector is not available in every environment. Its setup cannot be inferred from successful local GitHub CLI access.

## Entry prompt

Use a short request that points back to the versioned contracts:

```text
Use the GitHub plugin only with Jernej88/family-learning. Follow
docs/chatgpt-workflow.md and docs/topic-authoring.md from main to research and
propose a new <audience> topic for: <question>. Create a new branch and a draft
pull request. Never push to main, merge, or modify files outside the allowed
topic bundle and generated review-feed.json. Stop for my review.
```

For an update, name the existing topic and require `docs/topic-updating.md` as well.

## Authoring run

1. Confirm the repository is exactly `Jernej88/family-learning`, identify the current `main` SHA, and read the required files listed in `docs/topic-authoring.md` from that revision.
2. Restate the question and audience. Ask a focused question when missing information would materially affect scope, reading level, product instructions, jurisdiction, or safety. Never store personal details in Git.
3. Research and outline according to the authoring contract. Stop or narrow the topic when a high-stakes request seeks a property- or person-specific conclusion.
4. Propose the exact branch and file list and request approval for the writes.
5. Create `content/<slug>-<YYYYMMDD>` for a new topic or `content/<slug>-update-<YYYYMMDD>` for an update from the recorded `main` SHA. If that name exists, stop and ask the owner whether it is the same run; do not overwrite it or improvise a suffix.
6. Write only the approved topic bundle, required assets, and regenerated `review-feed.json`. Set the topic to `published` so full validation applies in the draft PR.
7. Self-review the story, interactions, quiz, sources, language, privacy, audience, and diff. Do not claim local commands ran in cloud Work unless their results are actually available.
8. Open a draft PR with the handoff required by `docs/topic-authoring.md`. Do not use issue-closing language.
9. Read CI. With new write approval, correct failures only inside the same allowed paths. If a fix needs application code, schema, workflows, settings, or another topic, report the limitation and stop.
10. Return the branch and draft-PR links, CI status, sources, unresolved issues, and human-review responsibilities. Stop for the owner; never merge.

## Human review

Automated checks do not approve generated educational content. The reviewer marks each item pass or fail:

- correct audience and age treatment;
- authoritative support for factual claims;
- appropriate Slovenian and reading level;
- coherent narrative or practical procedure;
- meaningful interactions rather than decorative controls;
- quiz coverage of the important concepts;
- transparent uncertainty and high-stakes boundaries;
- absence of personal data; and
- a surgical diff limited to the approved bundle and feed.

The reviewer also verifies the source access dates and actual CI result. Only a human may approve and merge the PR.

## Local/Codex fallback

If the connector fails the capability gate, use a local checkout or Codex with GitHub access. Follow the same repository, branch, allowed-file, validation, draft-PR, and human-review boundaries. Run the complete command set from `docs/topic-authoring.md`, push only the topic branch, open the draft PR, and read its checks.

Record that fallback use in the PR body. A successful fallback does not prove the cloud connector safe; cloud authoring remains blocked until its own smoke test passes.
