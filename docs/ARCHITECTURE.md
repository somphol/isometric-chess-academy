# Architecture

## Load order

```text
index.html  →  style.css  →  script.js
```

`script.js` is a single IIFE. In Node (`document` absent) it exports the engine and returns before touching the DOM. In the browser it boots on `DOMContentLoaded`.

```text
index.html
  ├─ #puzzle-data (JSON, 5 drills)
  ├─ static shell + data-i18n hooks
  └─ script.js
       ├─ Engine             pure chess rules / SAN / FEN / analysis
       ├─ I18N + PIECE_INFO  bilingual content
       ├─ UI state            settings, selection, clocks, puzzles
       ├─ Renderer            isometric canvas
       ├─ Flow                moves, undo, end-game, puzzles
       └─ Persistence/audio/export/events/boot
```

## Board model

- 64-cell array; `index = rank * 8 + file`; **rank 0 = rank 1**, file 0 = `a`.
- Piece shape: `{ type: 'p'|'n'|'b'|'r'|'q'|'k', color: 'w'|'b' }`.
- Game state: `board`, `turn`, `castling {wK,wQ,bK,bQ}`, `ep` (target index or `null`), `halfmove`, `fullmove`, `history`, `positionCounts`.
- FEN is the serialization boundary. Puzzle positions and saved games use it.

### Move pipeline

```text
generatePseudo(color)
  → clone position, apply move
  → reject if own king is attacked
  → legalMoves(color)  (memoised by position key)
  → playMove(g, move)
      sanBase + check/mate suffix
      applyInternal (capture, ep, castle rook, promotion, rights, clock)
      history.push({ san, fenBefore, fenAfter, captured, blunder })
```

Castling rights are cleared when a king moves, a rook leaves its home square, or a rook is captured on its home square. En passant is set only after a double pawn push. Threefold uses a position key of placement + turn + castling + ep.

### Status

`gameStatus(g)` returns `normal | check | checkmate | stalemate | draw`. Draw reasons are `fifty`, `threefold`, `material`. `insufficientMaterial` covers K vs K, K+minor vs K, and opposite-colour bishops on the same colour complex.

### Blunder guard

After a move, `analyzeBlunder(g, move)` (post-move position, opponent to move):

1. Is the moved piece attacked by a cheaper piece with no defender? → `hanging`.
2. Is it attacked by a cheaper piece while defended? → `exchange` if the loss is material.
3. Does the opponent have a mate in one? → `mate`.

It returns a compact object (`kind`, `severity`, `piece`, `square`, `attacker`, `attackerSquare`, `loss`, `san`) that the UI turns into bilingual prose. It is intentionally shallow — a teaching heuristic, not an engine.

## Isometric renderer

```text
x = ox + (f − r) · TW / 2
y = oy + (3.5 − (f + r) / 2) · TH
TH = 0.62 · TW
```

- Non-flipped: a1 is the bottom corner, h8 the top.
- `flipped` maps `(f,r) → (7−f, 7−r)` before projection.
- `pointToSquare` inverts the linear system, rounds in display space, maps back and then confirms the point lies inside the diamond.
- The board slab, tiles, grain/speckle and edge labels are rendered once into an offscreen canvas (`rebuildBoardCache`) and blitted each frame. **Rebuild on resize and flip.**
- Pieces are vector paths in a 100-unit space, scaled by `TW / 106`. The under-extrusion is drawn first with an offset for weight, then the gradient body.
- Draw order is by `baseY` (back to front). Hit testing uses a tapered silhouette (`halfW = TW · (0.235 − 0.062 · t)`), not the old bounding box, so a front piece cannot steal clicks from the tile behind it.
- Highlights are drawn after tiles and before pieces: last move (amber), check (red pulse), hover (blue), selection (cyan glow), legal moves (emerald dots + travelling pulse dots), academy pattern (emerald rings), keyboard cursor (dashed cyan).
- Animation is a 260 ms eased interpolation with a sine lift. A capture spark is a 420 ms ring.

The render loop runs at `requestAnimationFrame`; there is no idle throttle because the pulse dots and clocks are continuous. The static cache keeps the per-frame cost to a blit + overlays + pieces.

## UI state and persistence

`UI` holds language, sound, learning, guard, flip, tab, selection, legal moves, pattern, hover, keyboard cursor, last move, animation, clocks, mode, puzzle state, stats, coach text and modal state.

`localStorage` key: `isometricChessAcademy.v1`.

```json
{
  "version": 1,
  "casual": { "fen": "...", "initialFen": "...", "moves": [{ "from": "e2", "to": "e4" }], "clocks": { "w": 587, "b": 600 } },
  "settings": { "lang": "en", "sound": true, "learning": true, "guard": true, "flipped": false },
  "puzzles": { "solved": [], "streak": 0, "best": 0, "attempts": 0 },
  "stats": { "games": 0, "blunders": 0 }
}
```

On load the move list is replayed through the engine; a corrupt or illegal entry aborts restore and falls back to a fresh game. `file://` storage is best-effort and wrapped in try/catch.

## Puzzles

The five drills live in `<script type="application/json" id="puzzle-data">` and are parsed on boot. Each has:

```json
{
  "id": "back-rank",
  "level": 1,
  "title": { "en": "...", "th": "..." },
  "goal": { "en": "...", "th": "..." },
  "hint": { "en": "...", "th": "..." },
  "success": { "en": "...", "th": "..." },
  "lesson": { "en": "...", "th": "..." },
  "fen": "...",
  "expected": { "from": "d1", "to": "d8", "mate": true }
}
```

A move is correct only if it matches `expected` and, when present, `mate` / `check` holds on a cloned position. Wrong moves are rejected **before** commit, increment attempts and reset the current streak. Solving adds the id, increments solved/streak/best, and opens the lesson modal. `Retry` reloads the FEN; `Back to game` restores the casual snapshot taken on entry.

## Audio

`ensureAudio()` creates one `AudioContext` and a short noise buffer on the first gesture. `tone()` schedules oscillator + gain envelopes; `noise()` uses the buffer through a lowpass. Kinds: `move`, `select`, `capture`, `castle`, `check`, `promote`, `undo`, `blunder`, `error`, `success`, `end`. Nothing is loaded from disk.

## Adding a puzzle

1. Append a JSON object to `#puzzle-data` with all eight bilingual strings.
2. Use a legal FEN whose side to move is White. The side not to move must **not** be in check.
3. Verify the expected move with `Engine.findMove` and, for mates, `Engine.gameStatus(...).type === 'checkmate'`.
4. Run `node scripts/check.mjs`; every puzzle is validated automatically.

## Renaming or moving

If the repository changes name, update:

- `index.html` — OG/meta, footer GitHub link.
- `script.js` — PGN `[Site "..."]`.
- `README.md`, `AGENTS.md`, `state.json` deployment block.
