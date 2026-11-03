# Frequently asked questions

## Is this Thai chess (Makruk)?

No. This is **standard international chess**: kings, queens, bishops, rooks, knights and pawns, with castling, en passant, promotion, checkmate, stalemate and the usual draw rules. Thai is only an interface language. The page title and `state.json` both record this explicitly.

## Is there a computer opponent?

No. It is a local two-player hot-seat studio. The coach and the five puzzles are the teaching layer. A computer opponent is a large engine project and is not promised in [ROADMAP.md](../ROADMAP.md).

## Does it work offline?

Yes. Download or clone the repository and open `index.html`, or serve the folder locally:

```bash
python3 -m http.server 8080
```

There are no runtime network calls, no CDN assets and no web fonts.

## Where is my game saved?

In `localStorage` under `isometricChessAcademy.v1`, in the browser profile you are using. It saves the casual game, clocks, settings and puzzle progress. Nothing is sent to a server.

Progress can disappear if you:

- use a private/incognito window,
- clear site data,
- open a different browser or profile,
- switch between `file://` and `https://somphol.github.io`,
- use a future custom domain (a different origin).

Use **Export JSON** if you need a portable record.

## Why is the clock not running?

The clock starts after the first move. It pauses while a dialog is open (promotion, blunder explanation, game over, puzzle result). It stops at game end. If Black is to move, the White clock is the one that pauses.

## Why is the coach in only one language?

That is deliberate. The EN ⇄ TH toggle controls the whole interface, and only the selected language is shown. Switching language also re-renders an open lesson or blunder dialog. The other language is one click away, not mixed into the same paragraph.

## Why can't I castle?

All of these must be true:

- Your king and the chosen rook have not moved.
- The squares between them are empty.
- The king is not currently in check.
- The king does not pass through or land on an attacked square.
- The rook is actually on its home square (a1/h1 or a8/h8).

If the king is in check, block, capture the attacker or move the king. Castling is not a way out of check.

## Why did my pawn not capture forward?

Pawns capture diagonally forward, not straight ahead. A pawn on e4 can capture on d5 or f5, but e5 must be empty to move forward to e5. En passant is available only on the immediately following move after an adjacent double-step.

## How does promotion work?

Move a pawn to the last rank. A modal asks for queen, rook, bishop or knight. The chosen piece appears immediately and the move is written as `a8=Q`, `a8=R`, `a8=B` or `a8=N` (with `+` or `#` if applicable). Underpromotion is legal and sometimes correct.

## Can I import a PGN?

Not in 1.0.0. Export is supported; import is a roadmap candidate. The exported PGN includes a standard header block and SAN move text.

## What is in the JSON export?

Current FEN, start FEN, PGN, turn, status, clocks, full move history with SAN and FEN after each move, puzzle progress, local statistics and settings. It is generated locally as a Blob.

## Does it work on a phone or tablet?

Yes. The board, clocks and controls stack at 390 px. Touch uses the same tap-to-select, tap-to-move interaction. The layout was verified at 390 × 844; very small landscape screens may require scrolling.

## Can I play with only a keyboard?

Yes, partially. Focus the board with `Tab`, use arrow keys to move the dashed cursor, `Enter`/`Space` to select a piece or play a highlighted move, and `Esc` to clear. Dialog focus handling has known gaps; see [ACCESSIBILITY.md](ACCESSIBILITY.md).

## Why is there no drag-and-drop?

The interaction is deliberately click/tap based: it is reliable on touch, easier to explain, and works with the keyboard cursor. Drag-and-drop may be added later but is not a 1.x requirement.

## Which browsers are supported?

Current Chrome, Safari, Firefox and Edge are expected to work. The 1.0.0 automated run used headless Chrome; Safari and Firefox were not formally automated. See [TESTING.md](TESTING.md).

## Is it really 3D?

It is **2.5D**: an isometric projection rendered on a 2D Canvas. There is no WebGL, perspective camera, orbit control or 3D model. The fixed projection is a design decision, not a limitation of the rules.

## Why do the pieces look stylized rather than like a classic set?

They are original vector silhouettes designed to stay legible at small sizes and to be generated entirely in code, with no image assets. The Staunton-inspired plinth and proportions are intentional; the knight is an abstract profile rather than a photorealistic horse.

## Why does the coach sometimes say the move is risky when I am winning?

The blunder guard is a heuristic, not a deep search. It checks hanging pieces, losing exchanges and mate-in-one. It can be wrong about tactical defences. Use it as a prompt to look again, not as an oracle. You can turn it off with **Blunder guard**.

## Why are some labels low contrast?

Micro-labels use `--muted-2` at 4.32:1, slightly below WCAG AA for normal text. It is a known accessibility gap and is listed in [ACCESSIBILITY.md](ACCESSIBILITY.md). Body copy and controls meet the target.

## Can I use it in a classroom or club?

Yes, under the MIT licence. You may host it, print puzzle screens, or use it on a projector. Attribution is appreciated but not required by MIT. A short link back to the repository helps others find it.

## Can I add a puzzle or a translation?

Yes. Read [CONTRIBUTING.md](../CONTRIBUTING.md) and [PUZZLES.md](PUZZLES.md). Puzzle FENs and expected moves are validated by `node scripts/check.mjs`; every string needs both English and Thai.

## How do I report a bug or a security issue?

- Bugs and usage questions: [SUPPORT.md](../SUPPORT.md).
- Security or privacy vulnerability: private advisory via [SECURITY.md](../SECURITY.md). Do not open a public issue.

## Why is the version in several files?

The site has no build step, so the footer, JSON export, citation, changelog, README and build record are edited directly. [RELEASE.md](RELEASE.md) lists every location and the release checklist.
