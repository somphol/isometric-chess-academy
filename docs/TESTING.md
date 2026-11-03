# Testing

## Automated

```bash
node --check script.js
node scripts/check.mjs
```

`scripts/check.mjs` has no dependencies and currently runs 79 checks (72 app checks, plus 7 state-file checks once `state.json` exists):

| Area | What is checked |
|------|-----------------|
| Sources | all files present; stylesheet/script relative; no remote script/style/image; no `fetch`/XHR/WebSocket |
| Markup | canvas, language toggle, promotion modal, viewport meta |
| i18n | EN/TH key symmetry; every `data-i18n` and `t()` key exists; ≥150 keys |
| Puzzles | JSON parses; exactly five; unique ids; bilingual fields; legal FEN; White to move; expected move legal; mate/check claims |
| Rules | start perft 1–4 = 20 / 400 / 8902 / 197281; Kiwipete 1–2 = 48 / 2039 |
| Special moves | en passant capture + SAN; castling rook/king placement + SAN `O-O`; four promotion choices; `a8=Q+` |
| Notation | SAN sequence `e4 e5 Nf3 Nc6 Bb5 Nf6 O-O`; mate SAN ends `#` |
| Analysis | attack detection; material balance; state.json shape when present |

The engine is exported to Node, so these are the real rules used by the browser, not a duplicate implementation.

## Headless Chrome verification (1.0.0)

Chrome `--headless=new` over the DevTools Protocol, driven from a temporary Node script (not shipped). Zero console errors and zero uncaught exceptions in the final run.

Exercised:

- **Pointer mapping:** real `Input.dispatchMouseEvent` clicks on e2/e4 selected the pawn and played `e4`; after flipping, the same square mapping still selected e2 and played `e4`.
- **Selection UI:** cyan tile + two emerald dots for e2; academy Knight chip lights b1/a3/c3 (own pawn on d2 correctly excluded).
- **Promotion:** pawn a7→a8 opened the four-choice modal; choosing queen placed a white queen on a8 with SAN `a8=Q+`.
- **Checkmate:** back-rank position Qd8 produced `#`, opened the end modal with "Checkmate", and PGN `[Result "1-0"]`.
- **En passant:** e5xd6 ep removed the d5 pawn, produced `exd6`, and the FEN matched.
- **Blunder guard:** the line `e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 d5 exd5 Nxd5 Nxf7` flagged the knight on f7 as hanging to the king; modal opened with text in the selected language, "Watch out" mood, `Undo & learn` and `Keep the move`. Undo restored the position and reopened the "why" lesson.
- **Puzzles:** back-rank and ladder mate solved; wrong ladder move reset the streak, incremented attempts, rejected before commit; hint revealed; solved modal and streaks updated.
- **i18n:** EN ⇄ TH changed the title, controls, piece inspector (Knight → อัศวิน), movement text, puzzle list and coach; a visible-text scan found no Thai characters in English mode (initial, blunder modal, puzzle modal), and blunder text used Thai piece names in Thai mode.
- **Persistence:** after a reload, `e4 e5`, language `th`, clock values, puzzle solved list and undo-enabled state were restored.
- **Export:** PGN headers/SAN/result; JSON parses with `fen`, `history`, `puzzles`, `settings`.
- **Mobile:** 390×844, `scrollWidth === innerWidth`, canvas 368 px wide, no horizontal overflow.
- **Modal clock pause:** opening any modal stops the active clock; closing resumes it on the correct side.

## Manual regression list

Run after any rule, projection, i18n or layout change:

1. New game → e4 e5 → Nf3 Nc6 → Bb5 a6 → Ba4 Nf6 → O-O. History shows SAN; castling rights removed.
2. Castle queenside in a fresh position; rook lands on d1.
3. Push a pawn two squares; immediately capture en passant with an adjacent pawn.
4. Promote to each of Q/R/B/N; check board, SAN and sound.
5. Scholar's mate or the back-rank puzzle; confirm end modal, result header and clocks stop.
6. Hang a queen; confirm the blunder modal appears (guard on), switch EN/TH while it is open and confirm it re-renders in the selected language, then undo and replay.
7. Toggle learning off → coach dims; toggle on → coach returns.
8. Flip the board, select and move a piece by clicking; labels stay correct.
9. Switch EN ⇄ TH on each tab; inspect a piece; open a puzzle.
10. Reload during a game; confirm board, clocks, history and language restore.
11. Clear saved data; confirm new game, English, zero streaks.
12. 390 px viewport: board fits, tabs scroll into view, no horizontal scroll.
13. Disable storage (private mode) and play a move; the app must stay usable in memory.

## Not covered

- No automated Safari/Firefox run.
- No audio assertion (headless audio is not audible); ensure `AudioContext` resumes on first gesture.
- No long-game clock test beyond manual checks; the interval clamps background deltas to 2 seconds.
- Puzzle validation is single-move by design.
