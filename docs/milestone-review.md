# Milestone review

A milestone is a tag `vN` (`v1`, `v2`, …) on `main`. Before the tag, one big review covers
everything since the previous tag (the first one covers the whole repository). No script forces it:
the owner starts it by calling a model's CLI directly, on whatever model they pick, in a fresh
session. Adapted from malpaco's milestone review.

## How a milestone happens

1. The owner calls a milestone, or the main session proposes one when a coherent set of changes has
   landed (a redesign, a batch of new projects, an admin change).
2. The candidate is a commit on `main`. The main session opens a **milestone issue** (label
   `milestone`) with: the proposed tag, the candidate's full SHA, the previous tag, the PRs merged
   since (marking any that touch `admin.html` or `assets/admin.js`), the checks already run on the
   candidate, and the owner's decisions that are not defects. From then on `main` takes only fixes
   for the milestone's findings until it is tagged.
3. The owner starts the review from any checkout of this repository, for example:

   ```sh
   opencode run -m <model> "Read docs/milestone-review.md and review milestone issue #<n> as it says."
   claude -p --model opus "Read docs/milestone-review.md and review milestone issue #<n> as it says."
   codex exec "Read docs/milestone-review.md and review milestone issue #<n> as it says."
   ```
4. The reviewer opens one issue per reproduced finding and posts one verdict, AGREE or BLOCK, on the
   milestone issue.
5. BLOCK: the findings are fixed in ordinary PRs, the candidate moves to the new `main` commit (the
   issue says so) and the owner starts a re-review. After a third round without AGREE the owner
   decides.
6. AGREE: the main session tags exactly the reviewed SHA (`git tag vN <sha>`, `git push origin vN`).
   The owner may also tag without a review; the issue says so.

## Instructions for the reviewer

You are the independent reviewer of a github_landing_page milestone. You implemented none of it:
verify everything against the code, not commit messages or docs.

**Input.** The milestone issue number. `gh issue view <n> --comments` gives the tag, candidate SHA,
previous tag, PRs and checks; for a re-review, the earlier verdict and the fix PRs. If any of these
is missing, say so on the issue and stop.

**Set up.** `git fetch origin --tags`. If the working tree is clean, `git checkout --detach <sha>`,
run `node --test tests/portfolio.test.mjs`, and serve the site (`python -m http.server 8000`) to load
`index.html` and `releases.html` if you can; when you finish, check out the branch you started on. If
the tree is not clean, do not touch it: read the candidate with `git show <sha>:<path>` and say
which checks you could not run.

**Review** `git diff <previous tag>..<sha>` (or the whole tree for the first milestone) and follow
it into any file it touches or relies on. `CLAUDE.md` is the standard. Look hardest at:
`admin.html` and `assets/admin.js` (decryption, token handling, actions that must stay reversible),
secrets or decrypted data anywhere in the history, hand edits to `data/*.json`, private repository
names or notes in `config/portfolio.json`, links to repositories that are not public, broken links
or cards on the public page, and tests that pass without the behaviour they claim. Out-of-scope
problems elsewhere count too; mark them so.

**Write to GitHub yourself**, and only this; never edit, commit, push, tag or merge:
- one issue per reproduced finding: label `review` plus one of `bug`, `documentation` or
  `enhancement`; MUST-FIX or follow-up in the title's prefix; linking the milestone issue and SHA;
- always exactly one verdict comment on the milestone issue: AGREE, or BLOCK when any finding is
  MUST-FIX; the SHA reviewed, your model, whether you checked out the SHA, the checks you ran and
  their results, the issues you opened, and what you checked and found clean. A review that finds
  nothing still leaves this record.

Write comment and issue bodies to a file and pass `--body-file`. If posting fails, print the
complete text instead and say why.
