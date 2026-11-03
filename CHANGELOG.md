# Changelog

All notable changes to **Isometric Chess Academy & Studio** are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Complete reproduction handoff: build book, ADR log, provenance record, source/screenshot checksum manifest, and CI integrity checks.
- Professional release documentation: changelog, contributing, code of conduct, security, support, roadmap, citation, third-party notices, design/deployment/accessibility/release/privacy/puzzle/FAQ guides, issue forms, PR template, CODEOWNERS and Dependabot.

### Planned

- Native Thai copy review and a public accessibility audit.
- Additional puzzle packs and a classroom worksheet mode.
- Optional PGN import for reviewing an external game.
- Further Safari and Firefox verification.

Nothing in this section is a commitment or a schedule.

## [1.0.0] - 2026-11-02

The first public release. A complete offline chess studio in one HTML page.

### Added

- **Full international chess engine.** Legal move generation, check and checkmate detection, stalemate, castling (both sides), en passant, four-choice promotion, insufficient material, fifty-move rule and threefold repetition. Validated with perft to depth 4 (`197,281` nodes) and Kiwipete to depth 2 (`2,039` nodes).
- **2.5D isometric board.** A projected 8×8 diamond board on Canvas with slate and wood tiles, side-wall depth, coordinate labels, cached static layer, and click-to-square mapping that works when the board is flipped.
- **Hand-built vector pieces.** Six piece silhouettes with base plinths, gradients, extrusion, drop shadows and both colour sets. No image assets.
- **Interaction states.** Cyan selection, emerald move dots with travelling pulse dots, blue hover, amber last move, red check glow, dashed keyboard cursor and capture spark.
- **Bilingual interface (English / ภาษาไทย).** Complete static and dynamic translation, Thai typography, and a language switch that re-renders open lessons instantly. Only the selected language is visible.
- **Piece inspector.** Point value, movement rules, tactical role, short history and a coach's tip for every piece, with legal paths illuminated on the board. A compact peek card in Play links to the full Academy lesson.
- **Language-aware coach.** Position-sensitive guidance on centre control, development, king safety, material balance, checks, loose pieces and the opening phase.
- **Blunder guard.** Detects hanging pieces, losing exchanges and allowed mate-in-one, explains the problem in the selected language, and offers **Undo & learn**. The guard can be switched off.
- **Five puzzle drills.** Back-rank mate, ladder mate, save the bishop, royal fork and kingside castling, loaded from a local JSON block, with hints, lessons, attempts, current streak and best streak.
- **Game HUD.** White/Black clocks with active-side glow, SAN move history, material balance, phase, captured pieces and position status.
- **Synthesized Web Audio.** Move, capture, select, castle, check, promotion, undo, blunder, error, success and end-game cues generated with oscillators and noise. No audio files.
- **Persistence and export.** Auto-save of the casual game, clocks, settings and puzzle progress in `localStorage`; PGN and JSON downloads.
- **Responsive layout.** Desktop studio, stacked tablet layout, and a 390 px mobile layout with no horizontal overflow.
- **Keyboard operation.** Arrow keys move a board cursor; Enter selects and moves; Escape clears the selection.
- **Release engineering.** Dependency-free verification suite, GitHub Actions CI, GitHub Pages deployment, screenshots, architecture/testing docs and a historical build record in `state.json`.

### Changed

- The coach and lesson dialogs show **only the selected language** instead of printing English and Thai together. Switching language re-renders an open dialog.
- Clock autosaves are throttled to one write every ten seconds.
- Promotion dialogs now show black glyphs when Black promotes.

### Security

- No runtime network requests, analytics, CDN assets, remote fonts or third-party runtime dependencies.
- Exports are generated locally as Blobs; the app never uploads game data.
- See [SECURITY.md](SECURITY.md) for private vulnerability reporting.

### Known limitations

- No computer opponent; the game is local hot-seat.
- Puzzle checks are single-move drills, not full lines.
- The Thai copy is complete but has not yet had a native-speaker review.
- Safari and Firefox are expected to work but were not part of the automated 1.0.0 run.

[Unreleased]: https://github.com/somphol/isometric-chess-academy/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/somphol/isometric-chess-academy/releases/tag/v1.0.0
