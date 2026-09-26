# github_landing_page

A curated, static portfolio of my open-source projects, published with GitHub
Pages.

- **Public site** — `index.html` (this repo). Shows only public, portfolio-worthy
  projects.
- **Admin site** — lives in a **separate private repository**
  (`github_landing_page_admin`). It contains my full repository inventory,
  including private, archived and forked repos, and must never be published here.

## How it works

The page is plain HTML/CSS/JS with no build step. It reads
[`data/repositories.json`](data/repositories.json) and renders cards grouped by
section, with search, language and tag filters.

Each card links to:

- the **GitHub repository**,
- the **live site** (GitHub Pages) when the repo publishes one,
- the **homepage** when a different URL is configured.

## Data

`data/repositories.json` is **generated** in the private admin repo and only
ever contains public entries — private repositories are filtered out before this
file is written, so they cannot leak. See [`docs/TAXONOMY.md`](docs/TAXONOMY.md)
for the section and tag taxonomy.

## Local preview

```bash
python -m http.server 8000
# then open http://localhost:8000/
```

(Opening `index.html` directly also works, but `fetch()` may be blocked by the
browser's file:// rules, so a tiny local server is safer.)

## Deploy

Serve the repository root from GitHub Pages (Settings → Pages → branch `main`,
`/root`). `.nojekyll` is present so files are served as-is.
