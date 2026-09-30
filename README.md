# github_landing_page

A static portfolio of my open-source projects, published with GitHub Pages.

- **Public page** — [`index.html`](index.html): curated highlights plus a
  collapsed **full index** of every public, non-archived repository.
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
