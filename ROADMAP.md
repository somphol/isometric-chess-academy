# Roadmap

This is a living note, not a promise. Priorities follow teaching value, accessibility and the constraint that the app stays a single-page, dependency-free studio.

## Guiding principles

1. **Teach one idea at a time.** A new feature should make a beginner's next game calmer, not busier.
2. **The board stays the hero.** No dashboard outweighs the 2.5D board.
3. **Offline by default.** No accounts, no telemetry, no cloud requirement.
4. **Small surface area.** Three source files, no build step, no runtime dependencies.
5. **Western chess only.** Thai remains an interface language, never a ruleset.

## Shipped in 1.0.0

- Full international chess rules and SAN.
- Isometric Canvas board with vector pieces.
- Piece inspector and language-aware coach.
- Blunder guard with undo and explanation.
- Five beginner puzzles.
- Synthesized audio, localStorage and PGN/JSON export.
- English/Thai UI with no mixed visible language.
- CI, Pages deployment, docs and verification suite.

## Next — 1.1 candidates

| Item | Why | Risk |
|------|-----|------|
| Native Thai copy review | Natural phrasing and correct chess terminology | Needs a fluent reviewer |
| Accessibility audit | Canvas interaction and modal focus need independent testing | Medium; may change markup |
| More puzzle packs | Five drills is a small library | Content work; FEN validation scales |
| PGN import | Review a real game inside the studio | Parser and legality validation |
| Classroom worksheets | Printable puzzle sheets and answer keys | New output format |
| Saved game slots | Keep more than one casual game | localStorage schema change |
| Coach phrase variety | Less repetition after many moves | Content, not architecture |

## Later — exploring

- A gentle computer opponent with adjustable strength. This would be a large engine addition and is **not** a 1.x commitment.
- Opening-principle lessons beyond the current coach tips.
- Additional board palettes, with the same semantic highlight colours.
- A shareable puzzle link that carries the puzzle id only (no tracking parameters).

## Non-goals

- **Makruk / Thai chess rules.** This is international chess.
- **Online multiplayer, accounts or cloud saves.**
- **Analytics, advertising or tracking.**
- **A framework rewrite.** The vanilla constraint is part of the design.
- **WebGL or an orbitable 3D camera.** The fixed 2.5D projection is deliberate.
- **A full opening book or engine analysis UI.** The blunder guard is a teaching heuristic, not an analysis engine.

## How priorities are chosen

1. Correctness of the chess rules and saved data.
2. Accessibility and clarity for beginners.
3. Teaching value per unit of complexity.
4. Maintenance cost and the three-file constraint.

## Contributing to the roadmap

Open a feature request with the teaching problem, the smallest useful version, and what you would cut. See [CONTRIBUTING.md](CONTRIBUTING.md) and [SUPPORT.md](SUPPORT.md).
