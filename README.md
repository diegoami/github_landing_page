# github_landing_page

A static portfolio of my open-source projects, published with GitHub Pages.

- **Public page** — [`index.html`](index.html): curated highlights plus a
  collapsed **full index** of every public, non-archived repository.
- **Admin page** — [`admin.html`](admin.html): my complete repository inventory
  (including private, archived and forked repos). Reachable on the same site but
  **passphrase-protected**: the data ships only as AES-GCM ciphertext and is
  decrypted in the browser. No local server needed.

## How it works

Plain HTML/CSS/JS, no build step. The public page reads
[`data/repositories.json`](data/repositories.json); the admin page reads
[`data/repositories.admin.enc.json`](data/repositories.admin.enc.json) and
unlocks it with WebCrypto (PBKDF2-SHA256 → AES-GCM).

Each project links to:

- the **GitHub repository**,
- the **live site** (GitHub Pages) when the repo publishes one,
- the **homepage** when a different URL is configured.

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
# open http://localhost:8000/admin.html  (admin, needs passphrase)
```

(A local server is only needed for `fetch()` to work on your machine; the
deployed site needs none.)

## Deploy

Serve the repository root from GitHub Pages (Settings → Pages → branch `main`,
`/root`). `.nojekyll` is present so files are served as-is.
