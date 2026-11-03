# AGENTS.md — Isometric Chess Academy & Studio

## 1. What this is

A static, offline, bilingual teaching app for **standard international chess** — one HTML page, three source files, no build and no network. It renders an 8×8 board in a 2.5D isometric projection, plays a full casual game locally (two humans, hot-seat), and wraps it in an academy: piece inspector, language-aware coach, blunder guard, five puzzle drills, synthesized audio, localStorage and PGN/JSON export.

It is **not** Thai chess (Makruk), not a chess server, not an AI opponent, and not a framework starter. Thai is only an interface language. Current release: **v1.0.0**.

Live copy: <https://somphol.github.io/isometric-chess-academy/>
Local master: `~/Projects/isometric-chess-academy`

## 2. Commands

```bash
# run (no install, no build)
python3 -m http.server 8080
# open http://localhost:8080 — file:// also works

# verification (no dependencies)
node --check script.js
node scripts/check.mjs

# deploy = push to main; GitHub Pages serves the repo root
git push origin main
```

`scripts/check.mjs` runs 86 checks: perft, puzzle validation, i18n symmetry, release-documentation integrity, relative Markdown links and the state-file shape. Headless Chrome (CDP) was used for interaction testing during 1.0.0 but is not part of the repo; see [docs/TESTING.md](docs/TESTING.md).

## 3. Architecture

Load order is `index.html` → `style.css` → `script.js`. `script.js` is one IIFE:

1. **Engine** (`createGame`, `legalMoves`, `applyInternal`, `playMove`, `gameStatus`, `analyzeBlunder`). Pure functions over a 64-cell board (`index = rank * 8 + file`, rank 0 = rank 1). `Engine` is exported to Node via `module.exports` for the check suite.
2. **i18n** (`I18N.en`, `I18N.th`, `tIn`, `t`), `PIECE_INFO`, `TIPS`.
3. **UI state** (`UI`), localStorage (`isometricChessAcademy.v1`), DOM cache, sound.
4. **Renderer**: `tileCenter` / `pointToSquare` implement the projection; a cached static board layer is rebuilt on resize/flip; pieces are drawn back-to-front by screen `baseY`; hit testing uses an approximate silhouette (not a rectangle) so a front piece does not swallow clicks on the tile behind it.
5. **Game flow** (`selectSquare`, `attemptMove`, `commitMove`, undo, end-game), **puzzles** (JSON parsed from `#puzzle-data`), **export**, **modals**, **events**, **boot**.

Key formulas (non-flipped):

```text
x = ox + (f - r) * TW / 2
y = oy + (3.5 - (f + r) / 2) * TH
TH = 0.62 * TW
```

Clicking inverts that system, rounds to the nearest display square, then maps back through `flipped`. Piece scale is `TW / 106`; the board cache rebuilds whenever `resizeBoard` runs or the board is flipped.

Persistence: the casual game is stored as `{ fen, initialFen, moves[], clocks }` and replayed through the engine on load, so SAN and castling rights are rebuilt from legal moves rather than trusted from storage. Puzzle progress is separate (`puzzles.solved`, `streak`, `best`, `attempts`).

## 4. Decisions and constraints

- **Western chess rules are the product.** Do not substitute Makruk, add Thai chess pieces, or change the starting array. Castling, en passant, promotion, checkmate/stalemate and draw detection must stay.
- **No dependencies, no CDN, no web fonts, no runtime network.** The app must work from `file://` and GitHub Pages. `scripts/check.mjs` rejects external stylesheets/scripts/images and `fetch`/XHR/WebSocket in `script.js`.
- **The projection is fixed.** Board coordinates, `tileCenter`, `pointToSquare`, piece draw order and the hit-test silhouette all depend on it. If you change `TH` or the origin, change all four together and re-test flipped clicks.
- **Puzzles are data, not code.** They live in the `#puzzle-data` JSON block in `index.html`. Each expected move must be legal and, where marked, must produce mate/check; `scripts/check.mjs` enforces this. Do not add a puzzle with an illegal FEN — the side not to move must not be in check.
- **i18n must stay symmetric.** Every key exists in `en` and `th`; static text uses `data-i18n`, dynamic text uses `t()`. CI fails on divergence or a missing static/dynamic key. **Only the selected language may be visible:** the coach hides the inactive line with `html[lang]` CSS, and modals render only the active language.
- **The blunder guard is heuristic**, not a search engine. It flags hanging pieces, losing exchanges and allowed mate-in-one. It must explain, never scold, and must offer undo.
- **Timers pause while a modal is open.** Clock state lives in `UI.clocks` and is saved; the first move starts the clock.
- **Documentation is part of the release.** `README.md` is the index; every guide lives in `docs/` and every root policy file is linked from the README. `scripts/check.mjs` fails if a required doc is missing, a relative link is broken, or the changelog/citation/conduct/security files drift.
- **`state.json` is historical.** It records the build session, token usage and deployment. Do not wire it into runtime logic and do not refresh it to hide history.
- **No analytics, no tracking, no remote calls.** Exports are generated locally as Blobs.

## 5. Known issues

- **No computer opponent.** The game is intentionally hot-seat/local. The coach and puzzles are the teaching layer.
- **Puzzle validation is single-move.** Each drill checks one expected move; there are no scripted black replies or multi-move lines.
- **Thai copy is hand-written by the build agent.** It is consistent and complete, but a native Thai reviewer should proofread before a public marketing push.
- **Browser coverage:** verified in headless Chrome 1440×1180 and 390×844. Safari and Firefox are expected to work (standard Canvas/DOM APIs) but were not formally automated.
- **`localStorage` on `file://`** is per-browser-profile and may behave differently from an HTTP origin. The app degrades to in-memory play if storage is blocked.
- **The board is an isometric view, not a 3D engine.** There is no WebGL, no camera orbit and no perspective; the fixed 2.5D projection is deliberate.
- **Sound depends on the first gesture.** Browsers suspend `AudioContext` until interaction; the app resumes it on the first click/keypress.

## 6. Continuity

- **Deployed copy:** GitHub Pages, `main`, repository root. URL above.
- **Local master:** `~/Projects/isometric-chess-academy`.
- **History:** `state.json` captures the session id, wall-clock elapsed time, token counts and deployment URLs at release. `CHANGELOG.md` is the release history.
- **Documentation map:** [docs/README.md](docs/README.md) is the audience index; [README.md](README.md) is the human entry point; [ARCHITECTURE.md](docs/ARCHITECTURE.md) the technical map; [DESIGN.md](docs/DESIGN.md) the visual and pedagogical system; [TESTING.md](docs/TESTING.md) the verified matrix; [DEPLOYMENT.md](docs/DEPLOYMENT.md) Pages operations; [ACCESSIBILITY.md](docs/ACCESSIBILITY.md) honest gaps; [RELEASE.md](docs/RELEASE.md) the tag/checklist/hotfix process; [PRIVACY.md](docs/PRIVACY.md) data handling; [PUZZLES.md](docs/PUZZLES.md) the puzzle ladder; [FAQ.md](docs/FAQ.md) common questions.
- **Policies:** [CONTRIBUTING.md](CONTRIBUTING.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md), [SECURITY.md](SECURITY.md), [SUPPORT.md](SUPPORT.md), [ROADMAP.md](ROADMAP.md), [CITATION.cff](CITATION.cff), [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
- **Publishing:** the repository should stay public (MIT) and Pages should stay on `main` / `/`. If the repo is renamed, update the absolute URLs in `index.html` (OG tags), `README.md`, `AGENTS.md`, `script.js` (PGN `Site` header), `CITATION.cff` and `state.json`. Follow [docs/RELEASE.md](docs/RELEASE.md) before tagging.
