# Reproduction book

This document is the complete handoff for another AI agent or maintainer. It explains what the project is, what must be true, how it was built, how to verify it, and how to rebuild it if the source is ever lost.

**Read this first, then [ARCHITECTURE](ARCHITECTURE.md), [DESIGN](DESIGN.md), [TESTING](TESTING.md) and [PROVENANCE](PROVENANCE.md).**

> **If the three source files exist, they are the source of truth.** Do not rewrite the app from this book for style reasons. Use this book to understand, verify, extend, or reconstruct. The checksums in [MANIFEST.sha256](MANIFEST.sha256) identify the released source exactly.

## 1. What is being reproduced

**Isometric Chess Academy & Studio** is a single-page, offline, bilingual chess studio:

- **Ruleset:** standard international (Western) chess. Kings, queens, bishops, rooks, knights and pawns; castling, en passant, promotion, checkmate, stalemate, insufficient material, fifty-move and threefold repetition. **Not Makruk / Thai chess.**
- **Presentation:** an 8×8 board projected in a fixed 2.5D isometric view on HTML5 Canvas, with original vector piece sprites.
- **Teaching layer:** piece inspector, beginner coach, blunder guard with explanatory undo, five puzzle drills.
- **Languages:** English and Thai. Only the selected language is visible; the toggle re-renders open dialogs.
- **Delivery:** three source files (`index.html`, `style.css`, `script.js`), no build step, no runtime dependencies, no network calls, deployed on GitHub Pages.
- **Persistence:** `localStorage` plus local PGN/JSON downloads.

The release is **v1.0.0**. The app source is unchanged by documentation-only commits.

## 2. Requirements matrix

| Requirement | Implementation | Where |
|-------------|----------------|-------|
| Isometric 8×8 board on Canvas | `tileCenter`, `pointToSquare`, `drawFrame` | `script.js` |
| Click/touch screen → algebraic square | inverse projection + tile diamond test | `script.js` |
| Slate/wood board, depth, vector pieces, shadows | `drawSlab`, `drawTiles`, `drawPiece` | `script.js` |
| Hover blue, selected cyan, legal emerald | `drawHighlights` | `script.js` |
| Piece inspector with history, value, role, paths | `PIECE_INFO`, `inspectPiece`, `updateInspector` | `script.js`, `index.html` |
| Bilingual coach | `TIPS`, `coachAfterMove`, `setCoach` | `script.js` |
| Blunder guard + undo & learn | `analyzeBlunder`, `openBlunderModal`, `undoLast` | `script.js` |
| Five local JSON puzzles | `#puzzle-data`, `enterPuzzle`, `puzzleMoveIsCorrect` | `index.html`, `script.js` |
| Full rules + SAN | `generatePseudo`, `legalMoves`, `playMove`, `gameStatus` | `script.js` |
| Clocks, turn HUD, move history | `UI.clocks`, `updateClocks`, `updateHistory` | `script.js`, `index.html` |
| Synthesized Web Audio | `tone`, `noise`, `playSound` | `script.js` |
| EN ⇄ TH translation | `I18N`, `t`, `tIn`, `applyI18n` | `script.js`, `index.html` |
| Local autosave + export | `saveState`, `loadState`, `buildPgn`, `buildJson` | `script.js` |
| Responsive/mobile | CSS grid + breakpoints | `style.css` |
| Offline / no dependencies | static files, system fonts, Canvas audio | all |
| GitHub Pages | root of `main`, `.nojekyll` | repo |

Late clarifications that are now product requirements:

- **Western chess only.** Thai is an interface language, never a ruleset.
- **No mixed visible language.** English mode must contain zero Thai characters; Thai mode must contain no English prose.
- **The coach is language-aware, not a side-by-side translation.**
- **Documentation and state are part of the release.**

## 3. Non-negotiable constraints

| Constraint | Why | Enforcement |
|------------|-----|-------------|
| No frameworks, bundler or build | Works from `file://`, one page, lifetime simplicity | `scripts/check.mjs` rejects external scripts/styles |
| No runtime network calls | Offline classroom use, privacy | check rejects `fetch`/XHR/WebSocket in `script.js` |
| No web fonts or image assets | No layout shift, no CDN | system font stacks, Canvas paths, inline favicon |
| Standard international chess | Product identity | perft tests, puzzle validation, docs |
| Only selected language visible | Explicit user requirement | `html[lang]` CSS + dialog renderers + visible-text scan |
| Single-move puzzles | Beginner format | `puzzleMoveIsCorrect` + validator |
| Fixed 2.5D projection | Visual identity and click contract | formulas in this doc and `ARCHITECTURE.md` |
| `state.json` is historical | Honest build provenance | checked for shape, never loaded by the app |

## 4. Reference environment

The app itself needs only a modern browser. The build and verification environment was:

| Tool | Version / note |
|------|----------------|
| macOS | Darwin, Apple Silicon |
| Node.js | 26.13.0 local; CI uses Node 22 |
| Python | 3.x, only for `python3 -m http.server` |
| Git | system Git, `main` branch |
| Chrome | 156.0.8078.79 headless for interaction tests |
| Dependencies | **none**; no `npm install` |
| CI | GitHub Actions, Ubuntu, Node 22 |

Commands:

```bash
cd ~/Projects/isometric-chess-academy
python3 -m http.server 8080          # http://localhost:8080
node --check script.js
node scripts/check.mjs
```

## 5. Repository map

| Path | Role | Approx. lines |
|------|------|---------------|
| `index.html` | Shell, bilingual hooks, five-puzzle JSON, modals | 518 |
| `style.css` | Design tokens, layout, board frame, sidebar, responsive, Thai | 1088 |
| `script.js` | Engine + renderer + UI + academy + persistence | 3634 |
| `scripts/check.mjs` | 87-check dependency-free verification suite | ~250 |
| `docs/` | This book and the supporting guides | — |
| `assets/` | Four release screenshots | binary |
| `.github/` | CI, Dependabot, issue forms, PR template, CODEOWNERS | — |
| `state.json` | Historical build/session/token/deployment record | — |

Source line counts and SHA-256 hashes are in [MANIFEST.sha256](MANIFEST.sha256). Verify:

```bash
shasum -a 256 -c docs/MANIFEST.sha256
```

If you change a source file or screenshot, update the manifest and rerun the checks. CI fails when the manifest is stale (once the manifest check is present).

## 6. Build from scratch

If the source exists, skip to §13. If you must reconstruct, follow these stages in order. Each stage ends with an acceptance check. Do not start the next stage until it passes.

### Stage 0 — Scaffold

```bash
mkdir isometric-chess-academy && cd isometric-chess-academy
git init -b main
```

Create `index.html`, `style.css`, `script.js`, `.nojekyll`, `LICENSE` (MIT), `.gitignore`, and the docs folders. No package manager.

**Accept:** `python3 -m http.server 8080` serves a blank page without 404s.

### Stage 1 — HTML shell

Build the semantic shell in `index.html`:

1. Header: brand, title, subtitle, language toggle, sound toggle, New game.
2. Main grid: board panel + sidebar.
3. Board panel: `<canvas id="board">`, mode tags, toast, promotion modal, learn modal, end modal, puzzle modal, clocks, controls.
4. Sidebar: three tabs (`play`, `academy`, `puzzles`), coach card, peek card, position card, history card, inspector, puzzle list and active puzzle card, footer links.
5. `#puzzle-data` JSON block with five puzzles.
6. Footer with version, license and credits.

Use `data-i18n`, `data-i18n-aria` and `data-i18n-ph` hooks. Give every control an id used by `script.js`. Keep buttons as `<button type="button">`.

**Accept:** page renders with CSS disabled, every tab/panel exists, and the five-puzzle JSON parses with `JSON.parse`.

### Stage 2 — CSS system

Implement the tokens and layout from [DESIGN](DESIGN.md):

- Dark base, glass panels, 18–24 px radii, cyan/emerald/amber/coral semantics.
- Board frame with a radial studio glow.
- Sidebar sticky on desktop, stacked below 1180 px.
- Mobile breakpoints at 760 px and 420 px.
- Thai typography under `html[lang="th"]`.
- `html[lang="en"] .coach-th { display:none }` and the inverse. This is a product requirement, not decoration.
- Focus-visible outlines, skip link, `.sr-only`, reduced-motion CSS.
- Modal layers, promotion grid, end/learn/puzzle dialogs.
- `@media (prefers-reduced-motion: reduce)`.

**Accept:** 1440×1180 and 390×844 layouts have no horizontal overflow; English mode hides the Thai coach line.

### Stage 3 — Engine board and FEN

In `script.js`:

- 64-cell board, `index = rank * 8 + file`, rank 0 = rank 1.
- Piece object `{type, color}`; types `p n b r q k`.
- `createGame(fen)`, `loadFen`, `toFen`, `posKey`, `cloneGame`, `sqName`, `sqIndex`, `sqToFR`.
- Castling rights object `{wK,wQ,bK,bQ}`, en-passant target index or `null`, halfmove, fullmove, history, position counts.

**Accept:** start FEN round-trips exactly:

```text
rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
```

### Stage 4 — Move generation and legality

Implement:

- Pawn single/double step, diagonal captures, en passant, four promotions.
- Knight jumps; bishop/rook/queen rays; king steps.
- Castling: rights, rook present, empty squares, king not in check, king does not pass through or land on an attacked square.
- `isAttacked(g, f, r, by)` using pawn, knight, king and sliding patterns.
- `generatePseudo`, then `legalMoves` by cloning and rejecting moves that leave the own king attacked.
- Memoize `legalMoves` by `posKey(g) + '|' + color`.

**Accept:** perft from start: `20 / 400 / 8902 / 197281`. Kiwipete: `48 / 2039`.

### Stage 5 — Move application, SAN, status

- `applyInternal`: capture, en-passant removal, rook relocation, promotion replacement, castling-right updates, ep target, halfmove/fullmove, turn flip.
- `playMove`: SAN base, make the move, append `+`/`#`, record `fenBefore`/`fenAfter`/`captured`, push history, update position counts.
- `sanBase`: piece letter, disambiguation by file/rank, `x`, destination, `=Q`, `O-O`/`O-O-O`.
- `gameStatus`: normal, check, checkmate, stalemate, draw reasons `fifty`, `threefold`, `material`.
- `insufficientMaterial`, `materialBalance`, `findKing`, `inCheck`.

**Accept:** `e4 e5 Nf3 Nc6 Bb5 Nf6 O-O`; castling SAN `O-O`; promotion SAN `a8=Q+`; back-rank mate `Qd8#`; all checks in `scripts/check.mjs`.

### Stage 6 — Blunder heuristic

Implement `analyzeBlunder(g, move)` on the post-move position:

1. Hanging: moved piece worth ≥3 attacked by a cheaper piece, no defender.
2. Exchange: moved piece worth ≥5 attacked by a cheaper piece, material loss ≥2.
3. Mate threat: opponent has a legal move that gives checkmate.

Return `{kind, severity, piece, square, attacker, attackerSquare, loss, san}`. Do **not** build a search engine; the value is a short, beginner-relevant explanation.

**Accept:** the sequence `e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 d5 exd5 Nxd5 Nxf7` flags the f7 knight as hanging to the king.

### Stage 7 — Isometric renderer

Implement the projection:

```text
TW = min(w / 8.7, h / 4.9)
TH = 0.62 * TW
ox = w / 2
oy = 0.515 * h
depth = max(10, 0.22 * TW)

x = ox + (f - r) * TW / 2
y = oy + (3.5 - (f + r) / 2) * TH
```

Inverse:

```text
a = 2(x - ox) / TW
b = 7 - 2(y - oy) / TH
displayF = round((a + b) / 2)
displayR = round((b - a) / 2)
```

Then map back through `flipped ? 7 - f : f` (same for ranks) and confirm the point lies inside the destination diamond:

```text
|dx| / (TW/2) + |dy| / (TH/2) <= 1.02
```

Draw order:

1. Ambient shadow.
2. Board slab (sides then top).
3. Tiles (wood/slate gradients + deterministic grain/speckle).
4. Highlights (last move, check, hover, selected, legal dots/paths, pattern, keyboard cursor).
5. Pieces sorted by screen `baseY`.
6. Coordinates.
7. Capture spark.

Cache the static layer (ambient + slab + tiles + coordinates) in an offscreen Canvas. Rebuild on resize and flip.

**Accept:** click e2 then e4 by pointer; flip and repeat. No piece should be selected when its base tile is clicked; a front piece must not steal a click from the tile behind it.

### Stage 8 — Piece sprites

Draw each piece in a 100-unit space with base at `(0,0)`, scaled by `TW / 106`:

- Shared plinth 44×8 with a 4 px radius.
- Under-extrusion offset ~3 px in the piece's dark colour.
- Vertical gradient: `top → mid → low`.
- White palette: `#fffaf0 / #ecdfc6 / #bea77d`, stroke `#5a472b`.
- Black palette: `#93a6ba / #4b5f74 / #1b2733`, stroke `#071018`.
- Piece shapes: pawn (base, stem, collar, sphere), rook (tapered body, crenellations), knight (horse profile with muzzle, ear, eye, mane), bishop (stem, mitre, ball, slit), queen (flared body, five-point crown, balls), king (body, crown, cross, gold centre dot).
- Contact shadow ellipse under the base.

**Accept:** all 32 pieces are distinguishable at 390 px; white pieces remain legible on light wood; the last-move amber glow is under the piece.

### Stage 9 — Interaction and hit testing

- `hitSquare(x,y)` first tests pieces front-to-back with a tapered silhouette:
  - `dy` from `-height*1.03` to `+TH*0.42`.
  - `top = clamp(-dy / height, 0, 1)`.
  - `halfW = TW * (0.235 - 0.062 * top)`.
  - If no piece is hit, use the inverse tile mapping.
- `selectSquare`: if a selected piece has a legal move to the target, attempt it; otherwise inspect the target piece and, if it is the side to move, select it and show legal moves.
- Clicking an opponent piece while a move is selected must capture, not merely inspect.
- Keyboard: arrows move a cursor, Enter/Space selects/moves, Escape clears.
- Flip and resize invalidate the board cache.

**Accept:** real pointer clicks on e2/e4 work in both orientations. Clicking a piece's visible body selects it; the base tile mapping remains available where the silhouette does not cover it.

### Stage 10 — UI state, i18n, coach

- `UI` holds language, sound, learning, guard, flip, tab, selection, legal moves, pattern, hover, cursor, last move, animation, clocks, mode, puzzle state, stats, coach, modal state.
- `I18N.en` and `I18N.th` must have exactly the same keys. Static text uses `data-i18n`; dynamic text uses `t()` / `tIn()`.
- `setLanguage` updates `<html lang>`, calls `applyI18n`, then `updateAll`, then re-renders any open learn/puzzle/end modal.
- Coach: position-aware tips for centre control, development, castling, checks, material, loose pieces; both strings are stored but only the selected line is visible via CSS.
- Peek card in Play links to the full Academy inspector.
- Tabs use ARIA roles and `hidden` panels.

**Accept:** `node scripts/check.mjs` i18n checks pass; English mode has no visible Thai in the initial board, blunder modal or puzzle modal; Thai mode shows Thai coach/lesson prose.

### Stage 11 — Puzzles

Add the five fixtures in §12 to `#puzzle-data`. Implement:

- `parsePuzzles` on boot.
- `enterPuzzle(id)`: snapshot the casual game, load the FEN, switch to Puzzles, hide clocks, clear history UI.
- `puzzleMoveIsCorrect(move)`: match from/to/castle/promotion; clone and apply; require mate/check if declared.
- Wrong legal move: reject **before commit**, increment attempts, reset current streak, toast.
- Correct move: commit, add solved id, increment streak/best only when newly solved, show lesson modal.
- `retryPuzzle` reloads the FEN and keeps streaks; `nextPuzzle` finds the next unsolved; `exitPuzzle` restores the casual snapshot.

**Accept:** all five puzzles validate; wrong ladder move resets the streak; solving shows the lesson in the active language.

### Stage 12 — Audio, persistence, export

- **Audio:** one `AudioContext`, short noise buffer, oscillator envelopes. Kinds: `move`, `select`, `capture`, `castle`, `check`, `promote`, `undo`, `blunder`, `error`, `success`, `end`. Initialize on first gesture.
- **Persistence:** key `isometricChessAcademy.v1`. Store settings, casual move list + clocks + initial FEN, puzzle stats, stats. Replay moves through the engine on load; never trust a stored FEN alone.
- **Clocks:** 10 minutes; start after the first move; pause while a modal is open; resume on close; stop at game end; clamp background deltas to 2 s; autosave at most every 10 s.
- **PGN:** headers (Event, Site, Date, White, Black, Result, TimeControl, Orientation, Annotator), optional SetUp/FEN, SAN pair list.
- **JSON:** app, version, exportedAt, fen, startFen, pgn, turn, status, clocks, history, puzzles, stats, settings.
- **Downloads:** Blob + object URL + temporary `<a download>`.

**Accept:** reload restores `e4 e5`, language, clocks and puzzle progress; PGN has `[Result "1-0"]` after mate; JSON parses.

### Stage 13 — Documentation, CI, deploy

Create the documentation set, `scripts/check.mjs`, `.github/workflows/ci.yml`, issue forms, PR template, CODEOWNERS and Dependabot. Add `.nojekyll`.

CI:

```yaml
- uses: actions/checkout@v7
- uses: actions/setup-node@v7
  with: { node-version: '22' }
- run: node --check script.js
- run: node scripts/check.mjs
```

Deploy: push `main`, enable Pages from `main` / root. Verify root, `style.css`, `script.js`, `state.json` and `assets/hero.jpg` all return 200.

**Accept:** CI green, Pages build green, live site playable, docs reachable.

## 7. Engine contract details

### State

```js
{
  board: Array(64),              // {type, color} | null
  turn: 'w' | 'b',
  castling: { wK, wQ, bK, bQ },
  ep: number | null,             // target square index
  halfmove: number,
  fullmove: number,
  history: Move[],
  positionCounts: { [posKey]: number }
}
```

### Move object

```js
{
  from: { f, r }, to: { f, r },
  piece: 'p'|'n'|'b'|'r'|'q'|'k',
  color: 'w'|'b',
  promotion: 'q'|'r'|'b'|'n'|null,
  castle: 'K'|'Q'|null,
  ep: boolean,
  captured: { type, color } | null,
  san: string,
  fenBefore: string, fenAfter: string,
  blunder: object | null
}
```

### Castling

- White king e1 → g1/c1; black e8 → g8/c8.
- King and rook must be on home squares with rights.
- Squares between must be empty.
- King cannot be in check, pass through an attacked square, or land on one.
- Rook moves to f1/d1 or f8/d8.

### En passant

- Only immediately after an adjacent pawn double-step.
- Target is the square behind the passed pawn.
- Captured pawn is removed from `(to.file, from.rank)`.
- SAN is a normal pawn capture, e.g. `exd6`.

### Promotion

- Four legal choices, not only queen.
- `promotion` field drives board replacement, SAN `=Q`, and the modal glyph colour.
- Black promotion glyphs must be black in the modal.

### SAN

- Castling `O-O` / `O-O-O`.
- Piece letters uppercase; pawns have no letter.
- Disambiguate by file, then rank, then both.
- Captures `x`; check `+`; mate `#`; promotion `=Q`.

### Status and draws

`gameStatus` order: no legal moves → checkmate/stalemate; halfmove ≥ 100 → fifty; position count ≥ 3 → threefold; insufficient material; otherwise check/normal.

## 8. Renderer contract details

- Canvas CSS size comes from the board frame; DPR is clamped to 2.
- Static board cache is a physical-pixel canvas; draw it into the main context at CSS size.
- Draw slab sides before the top; draw tiles after the top; never draw a piece before a tile it stands on.
- `view.hit` is rebuilt every frame from drawn pieces; hit entries store `{f,r,cx,baseY,height}`.
- `height` = `pieceHeightUnits(type) * (TW/106)`.
- Animation: 260 ms, ease-in-out, sine lift `0.24 × TW`; skip the destination piece while animating.
- Capture spark: 420 ms expanding amber ring.
- Check glow: pulsing coral tile under the king of the side to move.
- Legal dots: pulsing emerald; captures use a ring; travelling dots appear only when `UI.learning` is true.
- Coordinates are drawn on the cached layer, outside the playable diamond.

## 9. UI contract

### Tabs

| Tab | Contents |
|-----|----------|
| Play | Coach, piece peek, position, history |
| Academy | Learning toggle, piece chips, full inspector, three rules |
| Puzzles | Progress, streak, five-item list, active puzzle card, authoring note |

Only one panel is visible. ARIA `role="tab"`, `aria-selected`, `aria-controls`, and `hidden` on inactive panels.

### Modals

| Modal | Trigger | Dismissal |
|-------|---------|-----------|
| Promotion | Pawn reaches last rank | Must choose Q/R/B/N |
| Learn | Blunder detected, or Undo & learn | Close/Keep; Undo where available |
| End | Checkmate, stalemate, draw, timeout | Play again / Review |
| Puzzle solved | Correct puzzle move | Next / Back to game |

All modals pause the clock. Opening focuses the first action. Escape closes informational modals, never promotion. Only the active language is rendered.

### Language isolation

- CSS: `html[lang="en"] .coach-th { display:none; }`, `html[lang="th"] .coach-en { display:none; }`.
- Coach stores both strings; visible line follows `html lang`.
- Blunder/undo/puzzle/end dialogs render only `UI.lang`.
- `setLanguage` re-renders an open learn/puzzle/end dialog.
- A visible-text scan must find no Thai characters in English mode.

### Responsive

- ≥1180 px: two-column board + sticky sidebar.
- 760–1180 px: single column, sidebar below board.
- ≤760 px: compact header, clocks wrap, board tags smaller, controls 3-across.
- ≤420 px: clocks two-column with turn pill below.
- No horizontal overflow at 390 px.

## 10. Data contracts

### localStorage

Key: `isometricChessAcademy.v1`

```json
{
  "version": 1,
  "casual": {
    "fen": "...",
    "initialFen": "...",
    "moves": [{"from":"e2","to":"e4","promotion":null,"castle":null}],
    "clocks": {"w": 587, "b": 600}
  },
  "settings": {"lang":"en","sound":true,"learning":true,"guard":true,"flipped":false},
  "puzzles": {"solved":["back-rank"],"streak":1,"best":1,"attempts":0},
  "stats": {"games":0,"blunders":1},
  "savedAt": 1790000000000
}
```

### PGN

```text
[Event "Isometric Chess Academy & Studio"]
[Site "https://somphol.github.io/isometric-chess-academy/"]
[Date "YYYY.MM.DD"]
[White "White"]
[Black "Black"]
[Result "1-0"]
[TimeControl "600+0"]
[Orientation "isometric-2.5d"]
[Annotator "OpenCode / DeepSeek V4.1 Flash"]

1. e4 e5 2. ... 1-0
```

Include `[SetUp "1"]` and `[FEN "..."]` when the start position is not the standard one.

### JSON export

Fields: `app`, `version`, `exportedAt`, `fen`, `startFen`, `pgn`, `turn`, `status`, `clocks`, `history[]`, `puzzles`, `stats`, `settings`.

### `state.json`

Historical only. Fields: project, release, ruleset, session, model, usage, artifacts, verification, deployment, credits. Never read at runtime.

## 11. Puzzle fixtures

| id | FEN | Expected | Requirement |
|----|-----|----------|-------------|
| `back-rank` | `6k1/5ppp/8/8/8/8/5PPP/3Q2K1 w - - 0 1` | d1→d8 | mate |
| `ladder-mate` | `7k/R7/8/8/8/8/8/1R4K1 w - - 0 1` | b1→b8 | mate |
| `save-bishop` | `6k1/5p2/8/1p6/2B5/8/5PPP/6K1 w - - 0 1` | c4→b5 | none |
| `royal-fork` | `6k1/3q4/8/3N4/8/8/8/6K1 w - - 0 1` | d5→f6 | check |
| `castle-home` | `4k3/8/8/8/8/8/5PPP/4K2R w K - 0 1` | e1→g1 | castle K |

The side not to move must not be in check. See [PUZZLES](PUZZLES.md) for the teaching notes.

## 12. Verification

```bash
node --check script.js
node scripts/check.mjs
shasum -a 256 -c docs/MANIFEST.sha256
```

Expected: `87 passed, 0 failed` after the manifest check is present, and every manifest line `OK`.

The suite validates:

- Files, local assets, no remote runtime assets, no `fetch`/XHR/WebSocket.
- EN/TH key symmetry, every `data-i18n` and `t()` key, required release docs, README links, relative Markdown links.
- Five puzzle FENs, expected moves, mates/checks.
- Perft start 1–4 and Kiwipete 1–2.
- En passant, castling, promotion, SAN, mate SAN, attack detection, material.
- `state.json` shape.
- SHA-256 manifest.

Manual/headless matrix is in [TESTING](TESTING.md). At minimum, reproduce:

1. Select e2 → e4 by pointer; undo.
2. Flip; select e2 → e4 by pointer.
3. Castle both sides.
4. En passant.
5. Promote to Q/R/B/N, including a black promotion.
6. Back-rank mate → end modal.
7. Blunder line → modal → Undo & learn.
8. Puzzle wrong move, hint, solve, streak.
9. EN ⇄ TH on every tab and an open dialog.
10. Reload restore.
11. Export PGN/JSON.
12. 390 px no overflow.

## 13. Deployment and credentials

The live site is GitHub Pages, repository root, `main`, `.nojekyll`.

```bash
node scripts/check.mjs
git push origin main
```

Pages can be enabled with the GitHub API (no token in the command shown; use your private credential config):

```bash
curl --config ~/.config/opencode-secrets/github.curl \
  -X POST https://api.github.com/repos/somphol/isometric-chess-academy/pages \
  -d '{"source":{"branch":"main","path":"/"},"build_type":"legacy"}'
```

**Credential rule for future agents:** this machine stores GitHub API credentials in `~/.config/opencode-secrets/github.curl` and a Git credential line in `~/.config/opencode-secrets/git-credentials`. Use them via `--config` / a local `credential.helper=store --file=...`. **Do not** print, copy or commit the contents. **Do not** call `git credential-osxkeychain` or read the Keychain; repeated prompts are a known annoyance and the stored files avoid them. The repository's local git config already points its credential helper at the store file.

Never commit tokens, `.env`, or the secrets directory.

## 14. Known deviations and gaps

| Item | State |
|------|-------|
| Computer opponent | Not built; hot-seat only |
| Puzzle depth | Single expected move; no scripted replies |
| Thai copy | Complete, not native-reviewed |
| Safari/Firefox | Expected, not automated |
| Canvas accessibility | Labelled application, not a per-square accessible grid |
| Modal focus trap | Not implemented |
| Reduced motion | CSS only; Canvas motion continues |
| `--muted-2` contrast | 4.32:1, below AA for normal text |
| PGN import | Not in 1.0.0 |
| Repro docs | Added after the v1.0.0 tag; main carries them, the tag is the app release |

These are documented in [ACCESSIBILITY](ACCESSIBILITY.md), [FAQ](FAQ.md) and [ROADMAP](../ROADMAP.md). Do not silently "fix" one without updating the docs and tests.

## 15. Recreate or restore?

| Situation | Action |
|-----------|--------|
| Source files exist and hashes match | Use them; read docs for context |
| Source exists but hashes differ | Inspect changes; decide whether to restore or accept a new release |
| Source missing, docs intact | Rebuild with this book, then run `scripts/check.mjs` and the manual matrix |
| Only README survives | Recover from the GitHub repository or release tag first |
| Deployed site broken | Revert the bad commit; see [DEPLOYMENT](DEPLOYMENT.md) |

## 16. Handoff checklist

- [ ] Read this book, [PROVENANCE](PROVENANCE.md), [ARCHITECTURE](ARCHITECTURE.md), [DESIGN](DESIGN.md).
- [ ] `node --check script.js` passes.
- [ ] `node scripts/check.mjs` passes.
- [ ] `shasum -a 256 -c docs/MANIFEST.sha256` passes.
- [ ] `git remote -v` points to the expected repository.
- [ ] `python3 -m http.server 8080` serves the app.
- [ ] Live site returns 200.
- [ ] `state.json` is treated as historical, not runtime.
- [ ] Any new string exists in both languages and only the active one is visible.
- [ ] Any new puzzle is legal and passes the validator.
- [ ] Any source change updates the manifest, changelog and docs.

## 17. Where to change what

| Change | Files |
|--------|-------|
| Rules, SAN, status, analysis | `script.js` engine section |
| Projection, tiles, pieces, highlights | `script.js` renderer section |
| Layout, palette, responsive | `style.css` |
| Static copy, tabs, puzzle JSON | `index.html` |
| Translations | `I18N` in `script.js` + `data-i18n` in `index.html` |
| Coach voice | `TIPS`, `coachAfterMove`, `PIECE_INFO` |
| Storage schema | `serializeCasual`, `restoreCasual`, `saveState` |
| Exports | `buildPgn`, `buildJson` |
| Verification | `scripts/check.mjs` |
| Release | `CHANGELOG.md`, version locations, [RELEASE](RELEASE.md) |
| Deployment | [DEPLOYMENT](DEPLOYMENT.md) |

## 18. Related documents

- [PROVENANCE](PROVENANCE.md) — original brief, session record, credentials, release history
- [DECISIONS](DECISIONS.md) — why the architecture looks like this
- [ARCHITECTURE](ARCHITECTURE.md) — technical map
- [DESIGN](DESIGN.md) — visual and pedagogical system
- [TESTING](TESTING.md) — verification matrix
- [DEPLOYMENT](DEPLOYMENT.md) — hosting operations
- [ACCESSIBILITY](ACCESSIBILITY.md) — honest gaps
- [PUZZLES](PUZZLES.md) — puzzle authoring
- [RELEASE](RELEASE.md) — release process
- [MANIFEST.sha256](MANIFEST.sha256) — exact artifact hashes
