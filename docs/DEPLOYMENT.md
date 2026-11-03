# Deployment

## Target

| Item | Value |
|------|-------|
| Host | GitHub Pages |
| Repository | `somphol/isometric-chess-academy` |
| Branch | `main` |
| Source path | `/` (repository root) |
| Build | None (static files, `build_type: legacy`) |
| Jekyll | Disabled by `.nojekyll` |
| HTTPS | Enforced by GitHub Pages |
| Custom domain | None |

The deployed copy is <https://somphol.github.io/isometric-chess-academy/>.

There is no build step, no artifact upload and no environment variable. A push to `main` is the deployment.

## First-time setup

1. Create the repository and push `main`.
2. In **Settings → Pages**, set **Source** to *Deploy from a branch*, branch `main`, folder `/ (root)*, then save.
   Or use the API:

   ```bash
   curl --config ~/.config/opencode-secrets/github.curl \
     -X POST https://api.github.com/repos/somphol/isometric-chess-academy/pages \
     -d '{"source":{"branch":"main","path":"/"},"build_type":"legacy"}'
   ```

3. Wait for the **pages build and deployment** workflow to finish.
4. Verify:

   ```bash
   curl -I https://somphol.github.io/isometric-chess-academy/
   curl -I https://somphol.github.io/isometric-chess-academy/script.js
   curl -I https://somphol.github.io/isometric-chess-academy/state.json
   ```

All should return `200`. The first deployment can take a minute or two.

## Routine deployment

```bash
node scripts/check.mjs
git push origin main
```

Then watch **Actions → pages build and deployment**. The site is live when the deployment job is green. GitHub Pages serves from a CDN; a hard refresh (`Cmd/Ctrl + Shift + R`) may be needed for a few minutes after a change.

## CI

`.github/workflows/ci.yml` runs on every push to `main` and on pull requests:

- `node --check script.js`
- `node scripts/check.mjs`

It uses Node 22 and no third-party packages. A failed check does not block the Pages deployment automatically, so read both workflow results. If you want a hard gate, enable branch protection and require the `verify` job before merging.

## Custom domain

1. Add a `CNAME` file at the repository root containing only the bare domain, for example `chess.example.com`.
2. At your DNS provider, add a `CNAME` record for the subdomain pointing to `somphol.github.io`.
3. In **Settings → Pages → Custom domain**, enter the domain and save.
4. Wait for the DNS check, then enable **Enforce HTTPS**.
5. Update the absolute URLs in:
   - `index.html` meta/OG tags and footer
   - `script.js` PGN `[Site "..."]`
   - `README.md`, `AGENTS.md`, `state.json` deployment block
   - `CITATION.cff` `url`

A custom domain changes the origin, so existing `localStorage` progress is not visible on the new domain. Browsers treat it as a different site.

## Rollback

The safest rollback is a revert commit:

```bash
git revert <bad-commit>
git push origin main
```

Pages rebuilds from the reverted tree. Do not force-push `main`; it rewrites history and makes the Pages deployment harder to audit.

If a deployment is broken because of a bad `CNAME` or Pages setting, fix the setting in **Settings → Pages** and re-run the latest deployment from **Actions**.

## Cache and stale assets

- Pages serves through a CDN. HTML usually updates quickly; assets can take a few minutes.
- For verification, append a unique query string (`?v=20261102`) to bypass a cached document.
- There is no service worker, so there is no client-side cache to clear.
- If an asset looks stale after several minutes, check that the file is present on `main` and that the latest Pages workflow succeeded.

## Local preview versus production

| Context | Behaviour |
|---------|-----------|
| `python3 -m http.server 8080` | Normal origin; `localStorage` persists per port |
| `file://…/index.html` | Works; storage is per browser profile and may be restricted |
| GitHub Pages | HTTPS origin; storage is per user/browser; no server data |
| Custom domain | New origin; previous progress is not carried over |

Use an HTTP origin when testing persistence, clipboard or download behaviour.

## Security notes

- No secrets, tokens or environment variables are needed to build or serve the site.
- Never commit `.env` files, GitHub tokens or the contents of `~/.config/opencode-secrets`.
- The app makes no network requests at runtime. GitHub itself may log requests as the host; see [PRIVACY.md](PRIVACY.md).
- There is no custom CSP header on GitHub Pages. Do not add remote scripts that would make that gap worse.

## Deployment checklist

- [ ] `node --check script.js` passes.
- [ ] `node scripts/check.mjs` passes.
- [ ] `shasum -a 256 -c docs/MANIFEST.sha256` passes.
- [ ] `CHANGELOG.md` reflects the release.
- [ ] Screenshots in `assets/` match the current UI.
- [ ] `state.json` deployment URLs are current.
- [ ] Push to `main`; both workflows are green.
- [ ] Live page returns 200 and loads `style.css`, `script.js` and one screenshot.
- [ ] Smoke test on desktop and a 390 px viewport.
- [ ] Tag and publish the GitHub release.
