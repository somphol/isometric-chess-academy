# Contributing

Thanks for considering a contribution. This project is deliberately small: three source files, no build step, no dependencies, and a strong preference for clarity over cleverness.

By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).

## Good ways to contribute

- **Bug reports** with browser, device, steps and a console screenshot.
- **Accessibility findings** — keyboard, screen reader, contrast, zoom.
- **Thai language review** — spelling, chess terminology, tone and natural phrasing.
- **Puzzle proposals** with a legal FEN, a verified solution and a teaching point.
- **Documentation fixes** — dead links, stale commands, unclear explanations.
- **Small, focused code improvements** that respect the constraints below.

Please open an issue before starting a large feature. It avoids duplicated work and keeps the design coherent.

## Ground rules

1. **Standard international chess only.** Do not add Makruk pieces or rules. Thai is an interface language, not a ruleset.
2. **No frameworks, CDNs, web fonts, analytics or runtime network calls.** The app must keep working from `file://` and GitHub Pages.
3. **No new runtime dependencies.** The verification suite uses only Node built-ins.
4. **Only the selected language may be visible.** Add every string to both dictionaries and hide the inactive coach line/lesson.
5. **Keep the projection contract intact.** If you touch `tileCenter`, `pointToSquare`, `TH`, the board origin or flip handling, retest real pointer clicks on both orientations.
6. **Puzzles must be legal and verified.** `node scripts/check.mjs` validates FENs and expected moves; do not weaken those checks.
7. **Do not commit secrets, tokens, credentials or personal data.**
8. **Update the docs when behaviour changes.** A stale handoff is a defect.

## Local setup

```bash
git clone https://github.com/somphol/isometric-chess-academy.git
cd isometric-chess-academy
python3 -m http.server 8080
# open http://localhost:8080
```

There is no `npm install`, no bundler and no build output.

## Before you open a pull request

```bash
node --check script.js
node scripts/check.mjs
shasum -a 256 -c docs/MANIFEST.sha256
```

All must pass. If you changed a source file or screenshot, update `docs/MANIFEST.sha256` in the same pull request. If you changed the board or UI, also do a manual pass:

- 1440 px desktop and 390 px mobile.
- English and Thai.
- Click a piece, move it, undo it.
- Flip the board and move again.
- Open the promotion modal, the blunder modal and a puzzle.
- Reload and confirm the game restores.

See [docs/TESTING.md](docs/TESTING.md) for the full regression list.

## Code style

- Vanilla ES6 inside one IIFE. No modules in the browser, no transpiler.
- Two-space indentation, semicolons, single quotes in JavaScript.
- Engine functions stay pure where possible; UI state lives in `UI`.
- Prefer small named functions over long callbacks.
- Do not add a comment that restates the code; explain a constraint or a decision.
- Canvas drawing should respect the cached static layer and the draw order contract.

CSS follows the existing custom-property system. Reuse `--cyan`, `--emerald`, `--amber`, `--coral`, `--panel`, `--line` and the existing radii rather than introducing near-duplicates.

## Adding or changing a string

1. Add the key to `I18N.en` and `I18N.th` in `script.js`.
2. Use `t('key')` for dynamic text, or `data-i18n="key"` for static markup.
3. If the string has a short/long variant, keep both languages equally complete.
4. Run `node scripts/check.mjs`; it fails on asymmetric or missing keys.

Do not hard-code English prose in the DOM when a translation key is appropriate.

## Adding a puzzle

Puzzles are data in the `<script type="application/json" id="puzzle-data">` block in `index.html`.

```json
{
  "id": "unique-kebab-id",
  "level": 1,
  "title": { "en": "...", "th": "..." },
  "goal": { "en": "...", "th": "..." },
  "hint": { "en": "...", "th": "..." },
  "success": { "en": "...", "th": "..." },
  "lesson": { "en": "...", "th": "..." },
  "fen": "legal FEN, White to move",
  "expected": { "from": "d1", "to": "d8", "mate": true }
}
```

Requirements:

- The side **not** to move must not be in check.
- White must be the side to move (the puzzle engine assumes the student is White).
- The expected move must be legal.
- If `mate` or `check` is claimed, the resulting position must prove it.
- The lesson should teach one idea, not summarize the whole game.
- Keep the copy warm and specific; avoid "obviously" and "simply".

`node scripts/check.mjs` validates all of the above. See [docs/PUZZLES.md](docs/PUZZLES.md) for the teaching notes.

## Pull requests

A useful pull request:

- Explains the problem and the chosen solution.
- Keeps the diff focused.
- States what was tested and on which browsers.
- Includes before/after screenshots for visual changes.
- Updates `CHANGELOG.md` under `[Unreleased]` for user-visible changes.
- Confirms the docs still match reality.

Use the pull request template. Maintainers may squash merges.

## Commit messages

Short imperative subject, then a body when the reason is not obvious.

```text
Fix flipped-board click mapping for tall pieces

The rectangle hit box swallowed clicks on the tile behind a piece.
Use a tapered silhouette and retest both orientations.
```

## License

Contributions are accepted under the [MIT License](LICENSE). By opening a pull request you confirm you have the right to submit the work under that license.

## Questions

- Usage and troubleshooting: [SUPPORT.md](SUPPORT.md)
- Security: [SECURITY.md](SECURITY.md)
- Design and architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/DESIGN.md](docs/DESIGN.md)
