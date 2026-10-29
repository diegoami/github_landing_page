# github_landing_page

A static GitHub Pages portfolio of these open-source projects: plain HTML, CSS and JS, no build
step (`README.md`). The main session plans and implements; reviews cover milestones, not every PR
(the owner, 2026-10-29, as in malpaco, goal2 and voice-teacher). The earlier harness_imperial review
profile (per-PR OpenCode reviewer, `harness.json`, `tools/harness/`) was removed; it is in the
history before that change.

## Rules
1. The main session plans and implements, on a branch, never on `main`. One PR per change, or per
   group of related changes.
2. The PR body is the contract: Scope, and Done when (each line one command anyone can run).
3. Merge once the Done-when lines pass, with green CI where there is one. No per-PR review is
   required.
4. Reviews are run by hand. Per PR, when the owner wants one, they start any model's CLI on the PR
   with `docs/review-pr.md` as its brief. At each milestone, one big review:
   `docs/milestone-review.md`. Any model may review. Relay review findings in full, never a subset.
5. **Choosing models:** the user decides. No quota, tier or chooser table applies to this project.
6. A test proves behaviour only if it fails when the behaviour is removed.
7. Never `git stash`; never force-push or rewrite `main` without the user.
8. A question is not a request to edit files. Answer it; propose any fix and wait.
9. No document carries a status snapshot: status lives on the PRs and issues.

## This project
10. `data/*.json` are generated in github_landing_page_admin and never edited here: no PR changes
    them by hand.
11. The admin page decrypts its data in the browser. The passphrase, a GitHub token and decrypted
    data never go into a commit, a PR, a review or a log.
12. The admin actions stay reversible (visibility, archive); no change adds deletion. A change to
    `admin.html` or `assets/admin.js` (decryption, token handling) is named in the PR so the owner
    can ask for a review before merge, and is listed in the next milestone issue.
