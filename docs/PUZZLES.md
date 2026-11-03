# Puzzle guide

The five drills are short, deterministic and single-move. They are designed to teach one pattern each, not to simulate a full game. Every puzzle is stored as JSON inside `index.html` and validated by `scripts/check.mjs` before release.

## The ladder

| # | Title | FEN | Solution | Idea |
|---|-------|-----|----------|------|
| 01 | Back-rank mate | `6k1/5ppp/8/8/8/8/5PPP/3Q2K1 w - - 0 1` | `Qd8#` | A castled king without luft is a cage |
| 02 | The ladder mate | `7k/R7/8/8/8/8/8/1R4K1 w - - 0 1` | `Rb8#` | Two rooks working one rank apart |
| 03 | Save the bishop | `6k1/5p2/8/1p6/2B5/8/5PPP/6K1 w - - 0 1` | `Bxb5` | Remove the attacker, not the attacked |
| 04 | The royal fork | `6k1/3q4/8/3N4/8/8/8/6K1 w - - 0 1` | `Nf6+` | A check that also wins the queen |
| 05 | Bring the king home | `4k3/8/8/8/8/8/5PPP/4K2R w K - 0 1` | `O-O` | Castling activates king and rook |

White is always the student. Each expected move is checked against the real engine; mate and check claims are proven on a cloned position.

## Teaching notes

### 01 — Back-rank mate

- **Ask:** "Which rank does the queen control, and which squares can the king actually use?"
- **Answer:** The black king is boxed in by its own f7/g7/h7 pawns. `Qd8#` controls the eighth rank and every escape.
- **Lesson:** A castled king still needs air. One pawn push — a *luft* — prevents this pattern.
- **Common miss:** Moving the queen to a square that gives check but leaves f8 or h8 free. The drill accepts only the mating move.

### 02 — The ladder mate

- **Ask:** "Which rook cuts the seventh rank? Which one climbs to the eighth?"
- **Answer:** The a7 rook already covers the seventh; `Rb8#` checks along the eighth and covers g8/f8/h8. The king cannot approach either rook in one move.
- **Lesson:** Rooks are strongest on open ranks. Two of them one rank apart form a cage.
- **Common miss:** `Ra8+`, which vacates the seventh rank and lets the king escape to g7.

### 03 — Save the bishop

- **Ask:** "What is attacking the bishop, and can you remove that attacker?"
- **Answer:** The b5 pawn attacks c4. `Bxb5` captures it and lands on a safe diagonal.
- **Lesson:** When a piece is attacked, you can move it, defend it or capture the attacker. Here the capture is clean.
- **Common miss:** A retreat such as `Bb3` also saves the bishop, but the drill teaches the more forcing lesson: remove the attacker. Only `Bxb5` is accepted.

### 04 — The royal fork

- **Ask:** "Which square lets one knight touch both the king and the queen?"
- **Answer:** `Nf6+` checks g8 and attacks d7. The king must answer the check, so the queen falls next move.
- **Lesson:** A fork works because the king must be saved first. Look for knights that touch two valuable targets.
- **Common miss:** `Ne7+` (checks, but does not attack the queen) or grabbing a pawn and losing the initiative.

### 05 — Bring the king home

- **Ask:** "Which two pieces can improve in one move?"
- **Answer:** `O-O` puts the king on g1 and the rook on f1. Both become safer and more active.
- **Lesson:** Castling is the only move that develops two pieces at once.
- **Common miss:** Walking the king to f1 manually, which loses the right to castle and leaves the rook passive.

## Puzzle flow

1. Load the puzzle from the Puzzles tab. The board replaces the casual position; the casual game is snapshotted.
2. Select a piece. Legal destinations glow emerald.
3. A wrong legal move is **rejected before it is committed**. Attempts increase and the current streak resets.
4. A correct move commits, plays a success cue, and opens the lesson after 430 ms.
5. The solved id is added, current streak and best streak update, and the lesson is shown in the selected language.
6. **Next puzzle** finds the next unsolved drill; **Back to game** restores the casual snapshot.

The clock is hidden during puzzles. The hint is free; it does not count as a wrong attempt. Retry reloads the FEN and keeps the streak, because retrying is practice, not a failed answer.

## Adding a puzzle

Append to the `#puzzle-data` JSON block in `index.html`:

```json
{
  "id": "unique-kebab-id",
  "level": 1,
  "title": { "en": "Short title", "th": "ชื่อสั้น" },
  "goal": { "en": "One sentence.", "th": "หนึ่งประโยค" },
  "hint": { "en": "A question, not the answer.", "th": "คำถาม ไม่ใช่คำตอบ" },
  "success": { "en": "Qd8# — why it works.", "th": "Qd8# — เพราะอะไร" },
  "lesson": { "en": "The transferable idea.", "th": "แนวคิดที่นำไปใช้ได้" },
  "fen": "legal FEN with White to move",
  "expected": { "from": "d1", "to": "d8", "mate": true }
}
```

Rules:

- The side **not** to move must not be in check; otherwise the position is illegal.
- White must be to move.
- `expected.from` and `expected.to` must be legal.
- `mate: true` must produce checkmate; `check: true` must produce check.
- `castle` and `promotion` are supported by the validator.
- Use one teaching idea per puzzle. If the lesson needs two paragraphs, split it into two puzzles.
- Keep the copy warm and specific. Avoid "obviously", "simply" and "just".

Run:

```bash
node scripts/check.mjs
```

The suite validates the JSON, id uniqueness, both languages, FEN legality, side to move, expected move and mate/check claim.

## Difficulty

Difficulty is the *idea*, not the number of pieces:

- **Level 1:** one pattern, one move, no defensive resource.
- **Level 2:** a check or a king-safety decision with one clear answer.
- **Level 3+:** not used yet. Before adding, consider whether a single move is still the right teaching format.

## What puzzles are not

- They are not full tactics trainers with black replies.
- They do not calculate a score or an Elo rating.
- They do not hide the solution behind a paywall or a timer.
- They do not require an account or a network call.

## Related

- [CONTRIBUTING.md](../CONTRIBUTING.md)
- [ARCHITECTURE.md](ARCHITECTURE.md) — puzzle data contract
- [DESIGN.md](DESIGN.md) — puzzle ladder and coach voice
