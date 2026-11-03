# Release process

## Versioning

The project follows [Semantic Versioning 2.0.0](https://semver.org/).

| Change | Version bump | Examples |
|--------|--------------|----------|
| Incompatible storage, export or public API change | **Major** | `localStorage` schema break, PGN format change, engine export rename |
| New user-facing capability | **Minor** | New puzzle pack, PGN import, board palette |
| Backwards-compatible fix or copy change | **Patch** | Click mapping fix, translation correction, contrast fix |

Pre-1.0 versions are not used; `1.0.0` was the first public release. Bump the `localStorage` key (`isometricChessAcademy.v1`) only when a schema change cannot be migrated; otherwise migrate on read.

## Version locations

The version is intentionally visible in several places. Update them together:

| File | What to change |
|------|----------------|
| `CHANGELOG.md` | Add the release heading and link |
| `README.md` | `**Version x.y.z**` at the top |
| `index.html` | Footer `vx.y.z` |
| `script.js` | JSON export `version: 'x.y.z'` |
| `CITATION.cff` | `version:` and `date-released:` |
| `state.json` | `release` (historical build record) |
| `AGENTS.md` | `Current release: **vx.y.z**` |
| `ROADMAP.md` | Move shipped items under the new version |
| `docs/TESTING.md` | Heading for the verified version |

Quick check:

```bash
grep -rn "x\.y\.z\|1\.0\.0" --exclude-dir=.git --exclude='*.jpg' .
```

## Release checklist

### Before tagging

- [ ] `node --check script.js`
- [ ] `node scripts/check.mjs` — all checks pass
- [ ] `shasum -a 256 -c docs/MANIFEST.sha256` — artifacts unchanged or manifest updated
- [ ] Manual regression from [TESTING.md](TESTING.md)
- [ ] English mode contains no visible Thai; Thai mode contains no English prose
- [ ] 1440 px desktop and 390 px mobile checked
- [ ] `CHANGELOG.md` has a dated section and compare link
- [ ] All version locations above updated
- [ ] Screenshots in `assets/` regenerated if the UI changed
- [ ] `README.md`, `AGENTS.md` and docs still describe reality
- [ ] `docs/MANIFEST.sha256` updated for every changed source/screenshot artifact
- [ ] `state.json` refreshed with final elapsed time and token usage
- [ ] No secrets, tokens or personal data staged

### Tag and publish

```bash
git add -A
git commit -m "Release vX.Y.Z"
git push origin main

git tag -a vX.Y.Z -m "Isometric Chess Academy & Studio vX.Y.Z"
git push origin vX.Y.Z
```

Then create the GitHub release from the tag, using the changelog section as the body. Attach nothing else: the site is the artifact, and GitHub's source archive is generated automatically.

### After publishing

- [ ] **Actions → check** is green.
- [ ] **Actions → pages build and deployment** is green.
- [ ] Live root returns 200.
- [ ] `style.css`, `script.js`, `assets/hero.jpg` and `state.json` return 200.
- [ ] One real move works on the live site.
- [ ] Language toggle, promotion and one puzzle work live.
- [ ] GitHub release is marked **Latest**.

## Release notes template

```markdown
## Highlights

- One sentence per headline.

## Added
- ...

## Changed
- ...

## Fixed
- ...

## Known limitations
- ...

**Full changelog:** compare link
```

Keep the release notes shorter than the changelog. Link to the live demo and the verification docs.

## Hotfix

1. Branch from `main`: `fix/short-description`.
2. Make the smallest fix; add a regression check if the failure is mechanical.
3. Run `node scripts/check.mjs`.
4. Bump **patch** version and add a changelog entry.
5. Merge to `main`, tag `vX.Y.Z+1`, publish.
6. Verify Pages and the live site.

## Rollback

- **Bad code:** revert the release commit on `main`, push, let Pages rebuild. Do not delete the release tag; users may cite it.
- **Bad Pages setting:** fix the setting in **Settings → Pages**, re-run the latest deployment.
- **Bad custom domain:** remove the `CNAME` file and the domain setting, then restore HTTPS.
- **Storage migration bug:** ship a patch that reads both old and new keys, never a silent destructive reset.

## Deprecation

Deprecate a public behaviour at least one minor release before removal:

1. Announce it in `CHANGELOG.md` under **Deprecated**.
2. Keep a compatibility path for one minor.
3. Remove in the next major.
4. Document the replacement in the changelog.

## Cadence

There is no fixed release schedule. Releases happen when there is a teaching improvement, a correctness fix or a meaningful accessibility gain — not to satisfy a calendar.

## Release record

`state.json` is a historical snapshot, not a build input. It records the session id, wall-clock elapsed time, token counters (including cache reads), model credits, artifact line counts, verification matrix and deployment URLs at the time of capture. Do not refresh it to hide history; add a new field or a new release note instead.

## Related

- [DEPLOYMENT.md](DEPLOYMENT.md)
- [TESTING.md](TESTING.md)
- [CHANGELOG.md](../CHANGELOG.md)
- [SECURITY.md](../SECURITY.md)
