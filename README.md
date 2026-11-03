# Isometric Chess Academy &amp; Studio

A complete, offline, bilingual chess studio on a hand-built **2.5D isometric board**. Full international chess rules, a piece-by-piece academy, a blunder guard that explains mistakes, five beginner puzzle drills, synthesized sound, and local progress saving — all in one HTML page with **no frameworks, no build step and no network calls**.

**Version 1.0.0** · [Live demo](https://somphol.github.io/isometric-chess-academy/) · MIT

![Isometric Chess Academy & Studio](assets/hero.jpg)

> **This is standard Western chess.** It uses kings, queens, bishops, rooks, knights and pawns with castling, en passant, promotion, checkmate, stalemate and the usual draw rules. Thai is only an interface language — this is **not Makruk** (Thai chess).

## Why it exists

Most beginner chess sites are either a bare board or a wall of theory. This studio puts a calm, tactile 2.5D board next to a patient coach. You can play a casual game, stop to inspect any piece, undo a blunder and read why it was dangerous, then practise the same idea in a five-minute puzzle.

## Features

### The board
- **True isometric projection** on HTML5 Canvas: every tile is a diamond, every piece is a vector sprite with a carved base, soft shadow and depth extrusion.
- **Click-to-square mapping** in both orientations, including a flipped board. Mouse, touch and keyboard all work.
- **Highlight language:** cyan selected tile, emerald move dots with travelling pulse dots, amber last move, blue hover, red check glow.
- **Responsive and HiDPI** with a cached static board layer so animation stays smooth.
- **Synthesized Web Audio:** move, capture, castle, check, promotion, undo, blunder, success and end-game cues. No audio files.

### The game
- Full international rules: pawn double-step, en passant, castling (both sides, all legality conditions), promotion (queen / rook / bishop / knight modal), check, checkmate, stalemate.
- Draw detection: insufficient material, fifty-move rule and threefold repetition.
- Turn management with a 10-minute clock per side, active-side glow and low-time warning.
- Move history in **Standard Algebraic Notation**, including disambiguation, `+`, `#`, `O-O`, `O-O-O` and `=Q`.
- Undo, board flip, new game, reset.

### The Academy
- **Piece inspector** for all six pieces: point value, movement rules, tactical role, a short history and a coach's tip. Opening it lights the piece's legal paths on the board.
- **Bilingual coach** (English / ภาษาไทย) that reacts to the position: centre control, development, king safety, material balance, checks and loose pieces.
- **Blunder guard** — after a move, the engine checks whether the piece is hanging, losing an exchange, or allowing mate in one. If it is, a pop-up explains the problem in both languages and offers **Undo & learn**.
- **Compact peek card** in the Play tab so clicking a piece always brings up its explanation, even while playing.

### The puzzles
Five drills loaded from a local JSON block in `index.html`:

| # | Puzzle | Idea |
|---|--------|------|
| 01 | Back-rank mate | The eighth rank is a cage when the pawns never move |
| 02 | The ladder mate | Two rooks working one rank apart |
| 03 | Save the bishop | Capture the attacker, not the attacked |
| 04 | The royal fork | A check that also wins the queen |
| 05 | Bring the king home | Castling activates two pieces at once |

Each puzzle has a hint, a bilingual lesson, attempts tracking, a completion streak and a best streak. Progress is saved separately from the casual game.

### Language and persistence
- **EN ⇄ TH toggle** translates every control, tab, lesson, piece description and puzzle. The coach always shows both languages, with the active one emphasised.
- Auto-saves the ongoing game (move list, clocks, settings) and puzzle streaks to `localStorage` under `isometricChessAcademy.v1`.
- **Export PGN** (`isometric_chess_game.pgn`) and **Export JSON** (`isometric_chess_progress.json`) download the current game, history, clocks, settings and puzzle progress.

## Run locally

There is no install and no build.

```bash
git clone https://github.com/somphol/isometric-chess-academy.git
cd isometric-chess-academy
python3 -m http.server 8080
```

Open <http://localhost:8080>. Opening `index.html` directly also works; the app only uses local files and `localStorage`.

## Controls

| Action | Mouse / touch | Keyboard |
|--------|---------------|----------|
| Select a piece | Click it | Arrow keys + Enter |
| Move | Click a highlighted square | Arrow keys + Enter |
| Clear selection | Click an empty square / Esc | Esc |
| Flip board | ⇅ Flip board | — |
| Undo | ↶ Undo | — |
| Change language | EN ⇄ TH | — |

Clicking a piece always opens its inspector card. In the Play tab the compact card links to the full Academy lesson.

## Verify

```bash
node scripts/check.mjs
```

The check suite is dependency-free and covers:

- Source/file integrity; no external runtime assets or network calls.
- English ↔ Thai dictionary symmetry and every `data-i18n` / `t()` key.
- All five puzzle FENs, expected moves, mates and checks.
- Perft: start position depths 1–4 (`20 / 400 / 8902 / 197281`) and Kiwipete depths 1–2 (`48 / 2039`).
- En passant, castling (rook and king placement), promotion, mate SAN, attack detection and material balance.
- `state.json` shape, when present.

The 1.0.0 release was additionally exercised in headless Chrome: real pointer clicks, flipped-board clicks, promotion modal, checkmate modal, blunder modal, puzzle wrong-turn + hint + solve, EN/TH switching, export, localStorage reload and a 390 px mobile viewport with no horizontal overflow.

## Deploy

GitHub Pages serves the repository root on `main`. There is no build output and no Jekyll processing (`.nojekyll` is present).

```bash
git push origin main
```

## Project layout

| Path | Purpose |
|------|---------|
| `index.html` | Markup, bilingual hooks and the five-puzzle JSON block |
| `style.css` | Studio theme, layout, modals, responsive rules, Thai typography |
| `script.js` | Chess engine + isometric renderer + academy/UI |
| `assets/` | README screenshots |
| `scripts/check.mjs` | Dependency-free verification suite |
| `state.json` | Historical build record: session time, model tokens, deployment |
| `AGENTS.md` | Handoff notes for the next agent |
| `docs/ARCHITECTURE.md` | Coordinate system, engine and rendering contract |
| `docs/TESTING.md` | Verification matrix and manual regression list |

## Credits

Built with **[OpenCode](https://opencode.ai)** and **DeepSeek V4.1 Flash** (`opencode-go/deepseek-v4.1-flash`).

`state.json` records the wall-clock build time and token usage captured from the OpenCode session database, including cache reads. It is a historical record, not runtime state.

## License

[MIT](LICENSE) © 2026 Somphol Boonjing
