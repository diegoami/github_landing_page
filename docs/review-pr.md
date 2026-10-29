# Reviewing one PR

Optional: the owner asks for it when a PR warrants one (for example a change to `admin.html` or
`assets/admin.js`). They start any model's CLI on a checkout of the PR head with this file as its
brief, for example:

```sh
opencode run -m <model> "Read docs/review-pr.md and review PR #<n> as it says."
```

## Instructions for the reviewer

You review one github_landing_page pull request. You did not write it; verify against the code, not
the PR's description. `CLAUDE.md` holds the project's rules. Do not edit, commit, push, merge or
label. Your final message is the review; post it as one comment on the PR
(`gh pr comment <n> --body-file <file>`) and post nothing else.

Check, in this order:
1. **Done-when.** Run every Done-when line of the PR yourself and report
   `DW<k>: ran <command> → <result>` or `DW<k>: not run — <reason>`.
2. **Generated data** (rule 10): no hand edit to `data/*.json`.
3. **Secrets and admin** (rules 11, 12): no passphrase, token or decrypted data anywhere in the
   diff; admin actions stay reversible, no deletion added.
4. **Public content:** no private repository name or private note in `config/portfolio.json`; every
   linked repository is public.
5. **Scope:** every changed file is one the PR needs; documents the change makes wrong are updated.
6. **Tests:** would each new test fail without the behaviour it claims? Say how you checked.

Blocking means a visitor or the owner would hit it through normal use, or anything that breaks
rules 10 to 12. Prove each finding (run it, or name the test that fails without the behaviour), or
label it unverified.

Your final message: the verdict (approve | approve after named fixes | rework | user decision), the
DW lines, the findings R1..Rn (file:line, blocking or not), and the verdict again last.
