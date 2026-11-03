# Documentation index

The project has one page of runtime code but more than one audience. Start with the path that matches you.

## I want to…

| Goal | Read |
|------|------|
| Play or teach with the app | [README](../README.md) · [FAQ](FAQ.md) |
| Rebuild or hand off the project | [REPRODUCTION](REPRODUCTION.md) · [PROVENANCE](PROVENANCE.md) · [DECISIONS](DECISIONS.md) |
| Understand how the board and engine work | [ARCHITECTURE](ARCHITECTURE.md) |
| Understand the visual and coaching system | [DESIGN](DESIGN.md) |
| Contribute code, copy or a puzzle | [CONTRIBUTING](../CONTRIBUTING.md) · [PUZZLES](PUZZLES.md) |
| Run the verification suite | [TESTING](TESTING.md) |
| Deploy, roll back or use a custom domain | [DEPLOYMENT](DEPLOYMENT.md) |
| Audit keyboard, screen reader or contrast behaviour | [ACCESSIBILITY](ACCESSIBILITY.md) |
| Cut a release or hotfix | [RELEASE](RELEASE.md) |
| Check what data is stored | [PRIVACY](PRIVACY.md) |
| Report a vulnerability | [SECURITY](../SECURITY.md) |
| Ask for help | [SUPPORT](../SUPPORT.md) |
| Plan the next change | [ROADMAP](../ROADMAP.md) |
| Cite the project | [CITATION](../CITATION.cff) |

## Guides

| Document | Scope |
|----------|-------|
| [REPRODUCTION.md](REPRODUCTION.md) | Requirements matrix, stage-by-stage rebuild recipe, engine/renderer/UI contracts, verification, deployment and handoff checklist |
| [PROVENANCE.md](PROVENANCE.md) | Original brief, clarifications, session/tool record, credential paths, release history, what was not done |
| [DECISIONS.md](DECISIONS.md) | ADR log for ruleset, projection, language isolation, storage, credentials and release process |
| [MANIFEST.sha256](MANIFEST.sha256) | Exact SHA-256 hashes for source files and screenshots |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Board model, move pipeline, SAN, status, blunder heuristic, projection formulas, renderer, storage schema, extension recipes |
| [DESIGN.md](DESIGN.md) | Palette, typography, board styling, interaction states, motion, coaching voice, Thai glossary, review checklist |
| [TESTING.md](TESTING.md) | 86 automated checks, headless verification, manual matrix, known gaps |
| [DEPLOYMENT.md](DEPLOYMENT.md) | GitHub Pages setup, CI, custom domain, cache, rollback, deployment checklist |
| [ACCESSIBILITY.md](ACCESSIBILITY.md) | Keyboard map, focus, contrast, verified behaviour and honest gaps |
| [RELEASE.md](RELEASE.md) | SemVer, version locations, release checklist, hotfix, rollback, notes template |
| [PRIVACY.md](PRIVACY.md) | localStorage contents, exports, hosting logs, clearing data |
| [PUZZLES.md](PUZZLES.md) | Puzzle ladder, teaching notes, authoring schema and validation |
| [FAQ.md](FAQ.md) | Rules, castling, storage, sound, browsers, classroom use |

## Policies and project files

| File | Purpose |
|------|---------|
| [CONTRIBUTING.md](../CONTRIBUTING.md) | Setup, style, i18n and puzzle rules, pull-request checklist |
| [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) | Contributor Covenant 2.1 |
| [SECURITY.md](../SECURITY.md) | Private vulnerability reporting and scope |
| [SUPPORT.md](../SUPPORT.md) | Troubleshooting and issue guidance |
| [ROADMAP.md](../ROADMAP.md) | Shipped work, candidates and non-goals |
| [CHANGELOG.md](../CHANGELOG.md) | Release history |
| [CITATION.cff](../CITATION.cff) | Citation metadata |
| [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md) | Dependency, artwork and licence notices |
| [AGENTS.md](../AGENTS.md) | Handoff notes for the next maintainer or agent |

## Documentation conventions

- **Version and date.** Versioned statements use the current release (`1.0.0`) and the release date (`2026-11-02`). The changelog is the source of truth for history.
- **Reality over aspiration.** Known gaps are labelled as gaps. The roadmap is explicitly not a schedule.
- **Language isolation.** Documentation may show English and Thai examples side by side, but the running interface must show only the selected language.
- **Links are tested.** `scripts/check.mjs` verifies that every required document exists, that the README links it, and that relative Markdown links resolve.
- **No secrets.** Never put tokens, credentials, private URLs or personal data in docs, screenshots, issues or commit messages.
- **`state.json` is historical.** It records the build session and must not be treated as runtime configuration.
- **Artifacts are checksummed.** Source/screenshot changes require updating `MANIFEST.sha256`; the check suite fails on a stale hash.
- **Handoff is explicit.** `REPRODUCTION.md` is the rebuild book; `DECISIONS.md` records constraints; `PROVENANCE.md` preserves the brief and session facts.

## Documentation health

Run:

```bash
node scripts/check.mjs
```

A release is not ready if the documentation checks fail. See [RELEASE.md](RELEASE.md) for the full gate.
