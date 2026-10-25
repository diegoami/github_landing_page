# github_landing_page

A static portfolio of my open-source projects, published with GitHub Pages.

- **Public page** — [`index.html`](index.html): projects grouped into **Mature
  projects**, **Work in progress**, **Demos**, **Libraries & tools** and **Unclassified**, with subject
  headings in WIP and demo groups and a collapsed **project index**. Mature
  projects and Libraries & tools each use one grid without subdivisions. Only explicitly
  selected projects are listed. Featured cards stay within their status group.
- **Beta releases** — [`releases.html`](releases.html): a tester-friendly page
  listing public `*-releases` repositories with links to their GitHub downloads
  and release notes.
- **Admin page** — [`admin.html`](admin.html): my complete repository inventory
  (including private, archived and forked repos). Reachable on the same site but
  **passphrase-protected**: the data ships only as AES-GCM ciphertext and is
  decrypted in the browser. No local server needed. Once unlocked, you can paste
  a GitHub token to perform **reversible** actions — change a repo's
  visibility (public/private) or archive/unarchive it. Deletion is not offered.

## How it works

Plain HTML/CSS/JS, no build step. The public page reads
[`data/repositories.json`](data/repositories.json); the admin page reads
[`data/repositories.admin.enc.json`](data/repositories.admin.enc.json) and
unlocks it with WebCrypto (PBKDF2-SHA256 → AES-GCM).

Each project links to:

- the **GitHub repository**,
- the **live site** (GitHub Pages) when the repo publishes one,
- the **homepage** when a different URL is configured.

The beta releases page automatically lists public repositories whose names end
in `-releases`, using the public repository data file. Each entry links to the
repository's GitHub Releases page, where testers can download available builds
and read version notes.

## Data

Both data files are **generated** in a private admin repository, never edited by
hand here:

- `data/repositories.json` — public, non-archived repos only (no private names).
- `data/repositories.admin.enc.json` — the encrypted master inventory.

See [`docs/TAXONOMY.md`](docs/TAXONOMY.md) for the section and tag taxonomy.

## Configure the portfolio

Edit [`config/portfolio.json`](config/portfolio.json), either locally or with
GitHub's file editor. This is hand-maintained content, separate from the
generated inventory. Find a repository by its exact, case-sensitive name:

```json
"Scopetta": {
  "status": "mature",
  "visible": true,
  "summary": "Play Italian Scopa in your browser. Includes the rules and scoring.",
  "curated": true,
  "featured": true,
  "tags": ["card-game", "scopa", "browser-game"],
  "liveUrl": "https://scopetta.netlify.app/",
  "downloadUrl": "https://github.com/diegoami/Scopetta/releases/latest"
}
```

Valid statuses:

- `mature` — established and ready to use; maintenance continues.
- `wip` — work in progress.
- `demo` — a prototype, experiment or demonstration.
- `tools` — a reusable library or practical utility.
- `unclassified` — status not yet chosen (the default).

`liveUrl` sets the **Open app** link; without it, the generated Pages URL or
homepage is used. `downloadUrl` adds a **Downloads** link. Both must be absolute
HTTP(S) URLs.

`summary` is the public text shown on the card and in the full index, and is
searchable. It is plain text, not HTML or Markdown. `curated: true` gives the
project a card; `false` keeps it in the full index only. `featured: true` adds a
badge and puts the card first within its subject group. It needs
`curated: true` to appear as a card.

`tags` is an optional array of nonempty strings. It replaces the generated tags
and controls the card badges, tag filter and search. Omit it to keep the generated
tags, or use `[]` to show no tags. Prefer descriptive tags such as `card-game`,
`geography`, `subtitles` or `developer-tools`; language has its own filter too.

`visible: true` includes a project on the public page. `false` hides it completely,
including from search, counts, filters and the project index. Omitted `visible`
defaults to **false**, so new inventory entries stay hidden until you select them.
Legacy and other unselected projects remain in the configuration for later editing.
This controls the page presentation; the generated public JSON is still readable.

Every field in a repository's settings is optional. Omit `summary`, `curated` or
`featured` to use the generated inventory's value. Omit `status` to use Unclassified.

To include a **public** project missing from the generated inventory, add an
entry with an explicit `repositoryUrl`, a `summary`, and a `status`. For example:

```json
"goal2": {
  "repositoryUrl": "https://github.com/diegoami/goal2",
  "status": "wip",
  "visible": true,
  "summary": "A faithful rebuild of Goal (1993), alongside a World Cup bot.",
  "language": "Python",
  "section": "games",
  "curated": true
}
```

`language` and `section` optionally override the generated language and subject
ID (subject IDs come from `data/repositories.json`, such as `games` or `devtools`).
Supplemental projects default to curated cards, no highlighting, no tags and the
Other subject. They merge with the generated entry once the inventory includes
them. Unknown names without `repositoryUrl` are ignored. `repositoryUrl` also
overrides the repository link for existing entries. These settings control the
portfolio only; they do not change repository visibility on GitHub.

Do not put private repository names or private notes in this public file.

Validate edits with `node --test tests/portfolio.test.mjs`, then use the local
preview below. Commit changes and merge them to `main` to publish through the
existing GitHub Pages deployment. The encrypted admin page still manages GitHub
visibility and archiving; portfolio content is configured in this file.

When changing JavaScript or adding configuration fields, update the `v` query
in both the `index.html` app script URL and the `assets/app.js` portfolio import
to a new matching release value. GitHub Pages caches scripts for ten minutes;
these URLs prevent a cached validator from rejecting freshly loaded settings.

## Local preview

```bash
python -m http.server 8000
# open http://localhost:8000/       (public)
# open http://localhost:8000/releases.html (beta releases)
# open http://localhost:8000/admin.html  (admin, needs passphrase)
```

(A local server is only needed for `fetch()` to work on your machine; the
deployed site needs none.)

## Deploy

Serve the repository root from GitHub Pages (Settings → Pages → branch `main`,
`/root`). `.nojekyll` is present so files are served as-is.
