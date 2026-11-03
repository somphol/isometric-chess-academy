# Support

## Before opening an issue

Try the quick checks below. Most reports turn out to be one of them.

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Blank board or no buttons | JavaScript disabled or blocked | Enable JavaScript; try a current Chrome, Safari, Firefox or Edge |
| No sound | Browser autoplay policy | Click the board or a button first, then use the sound toggle |
| Sound stays off | Toggle muted or OS output changed | Press the speaker button; check the system volume |
| Progress disappeared | Private window, cleared site data, or a different browser profile | Play in a normal window; use **Export JSON** for a portable copy |
| Progress differs between `file://` and the live site | Browsers treat them as different origins | Use one origin consistently |
| Coach shows the wrong language | The EN ⇄ TH toggle is global | Press **EN ⇄ TH** and reopen any dialog |
| Cannot castle | King/rook moved, squares occupied, or the king is in/through check | See [docs/FAQ.md](docs/FAQ.md#why-cant-i-castle) |
| Board is upside down | The board was flipped | Press **⇅ Flip board** |
| Export does nothing | Downloads blocked by the browser | Allow downloads for the site and retry |

## Documentation

- [README.md](README.md) — features, controls, local run
- [docs/FAQ.md](docs/FAQ.md) — rules, storage, browsers, classroom use
- [docs/PUZZLES.md](docs/PUZZLES.md) — puzzle guide and authoring
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — engine and renderer
- [docs/TESTING.md](docs/TESTING.md) — verification matrix
- [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md) — keyboard and screen-reader notes
- [docs/PRIVACY.md](docs/PRIVACY.md) — local data and hosting logs

## Bugs and feature requests

Use the GitHub issue forms:

- [Report a bug](https://github.com/somphol/isometric-chess-academy/issues/new?template=bug_report.yml)
- [Request a feature](https://github.com/somphol/isometric-chess-academy/issues/new?template=feature_request.yml)

A useful bug report includes:

- Browser and version, operating system, and device.
- The URL (live or local) and whether the board was flipped.
- Exact steps to reproduce.
- What you expected and what happened.
- A screenshot or console error if available.
- Whether the language was English or Thai.

Please remove personal information and never paste tokens or passwords.

## Security

Do **not** open a public issue for a vulnerability. Follow [SECURITY.md](SECURITY.md) and use a private security advisory.

## Questions and teaching use

Classroom, club and workshop use is welcome under the MIT licence. For a question that is not a bug, open a feature-shaped issue and explain the teaching context. Please do not ask for private tutoring or game analysis through the issue tracker.

## Response expectations

This is a single-maintainer project. Reports are usually read within a few days. There is no paid support, SLA or guaranteed fix date. Clear, reproducible reports are prioritised over broad redesign requests.
