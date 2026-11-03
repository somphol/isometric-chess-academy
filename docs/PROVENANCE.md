# Provenance

This is the historical and operational record of how the project was commissioned and built. It exists so a future maintainer can distinguish *requirements* from *implementation choices*, and can reproduce the build without guessing.

- **Product:** Isometric Chess Academy & Studio
- **Release:** 1.0.0
- **Repository:** <https://github.com/somphol/isometric-chess-academy>
- **Live site:** <https://somphol.github.io/isometric-chess-academy/>
- **GitHub release:** <https://github.com/somphol/isometric-chess-academy/releases/tag/v1.0.0>
- **Local master:** `~/Projects/isometric-chess-academy`

The authoritative build-time/token record is [`state.json`](../state.json). This document does not duplicate those counters, because the capture time and model accounting are recorded there.

## 1. Commissioning brief

The following is the original task brief, preserved verbatim. It defines the product; later clarifications are recorded in §2.

> =========
>
> TASK: Build a complete, production-ready, interactive 2.5D/3D Chess
> web application named "Isometric Chess Academy & Studio" using vanilla
> HTML5, CSS3, ES6 JavaScript, and HTML5 Canvas.
>
> ======================================================================
> PROJECT BACKGROUND & PEDIGREE:
> ======================================================================
> This application is part of an open-source digital board game series
> modeled after interactive academy studios (such as bilingual 3D chess
> and strategy training environments). Its purpose is to combine smooth
> 2.5D isometric gameplay with robust beginner learning tools, real-time
> coaching feedback, and zero external framework dependencies. It is
> optimized for GitHub Pages deployment.
>
> ======================================================================
> 1. VISUAL & CANVAS RENDERING ENGINE (2.5D ISOMETRIC)
> ======================================================================
> - Isometric Projection:
>   * Render an 8x8 chessboard projected into 2.5D isometric view on HTML5 Canvas.
>   * Tile Coordinates: Map screen clicks (mouse/touch) back to internal
>     8x8 algebraic grid coordinates (A1 to H8).
> - Visual Aesthetics:
>   * Modern slate/wood board texture with clean depth side-walls and
>     stylized vector piece sprites featuring soft drop-shadows.
>   * Highlight States: Hover state (soft blue), selected piece tile
>     (bright cyan #00E5FF), and valid move indicator dots (translucent emerald #00E676).
>
> ======================================================================
> 2. BEGINNER COACHING & INTERACTIVE ACADEMY STUDIO (NEW MODULE)
> ======================================================================
> Provide a dedicated "Learning Mode / Academy" toggle panel in the UI:
>
> - Interactive Piece Movement Inspector:
>   * Clicking any piece brings up a side panel explaining its historical role,
>     point value, and movement rules, while illuminating its valid paths
>     on the board with animated pulse dots.
> - Bilingual Strategic Coaching HUD:
>   * Real-time bilingual (English / ภาษาไทย) feedback box offering gentle
>     tactical reminders during casual play (e.g., "Control the center squares!",
>     "Protect your king by castling early!").
> - Smart "Undo & Learn" Blunder Guard:
>   * Option to allow beginners to undo a disastrous move with an instant
>     pop-up explanation of why the blunder occurred.
> - Mini-Puzzle Drills Tab:
>   * 5 built-in beginner puzzles ("Mate in 1", "Protect the Bishop") loaded
>     directly from local JSON data structures.
>
> ======================================================================
> 3. GAME LOGIC & INTERACTION ENGINE
> ======================================================================
> - Rule Implementation:
>   * Full standard chess validation: pawn double-step, en passant,
>     castling, and pawn promotion modal window.
>   * Turn management (White vs. Black) with active visual HUD timer.
>   * Interactive Move History sidebar displaying moves in Standard
>     Algebraic Notation (SAN).
>
> ======================================================================
> 4. BILINGUAL HUD, AUDIO & LOCAL DATA PERSISTENCE
> ======================================================================
> - Sound Effects:
>   * Synthesized Web Audio API sound effects for moves, captures,
>     and checks (no external audio assets required).
> - Language Switcher (EN ⇄ TH Toggle):
>   * Instantly translates all UI controls, academy lessons, and coaching
>     tips between English and Thai (ภาษาไทย).
> - Local Storage & Export Engine:
>   * Auto-saves ongoing game progress and puzzle completion streaks
>     to browser localStorage.
>   * "💾 Export Game PGN / JSON" downloads progress files.
>
> ======================================================================
> OUTPUT FORMAT REQUIREMENT
> ======================================================================
> Provide the complete source code clearly divided into three code
> blocks labeled:
> - index.html
> - style.css
> - script.js

## 2. Late clarifications

These override or refine the brief and are part of the final product:

1. **Classic Western chess only.** The owner explicitly said not to turn the project into Thai chess (Makruk). Thai remains an interface language.
2. **No mixed visible language.** With English selected, no Thai text may be visible; with Thai selected, no English coach/lesson prose.
3. **Publish to GitHub and GitHub Pages.** The project was uploaded as a public repository and deployed.
4. **Avoid repeated macOS Keychain prompts.** Credentials must come from the stored secret files, not repeated Keychain reads.
5. **Add `state.json`.** Record build wall-clock time, total token usage, deployment URLs, OpenCode and model credits. Treat it as historical, not runtime state.
6. **Professional release documentation.** Add the standard changelog, contributing, conduct, security, support, roadmap, citation, issue/PR templates and supporting guides.
7. **Full reproduction handoff.** Document everything another AI agent needs to rebuild the project, because session context is lost after termination. This document, [REPRODUCTION](REPRODUCTION.md), [DECISIONS](DECISIONS.md), [MANIFEST.sha256](MANIFEST.sha256) and the docs index are the result.

## 3. Build session

| Item | Value |
|------|-------|
| Tool | [OpenCode](https://opencode.ai) |
| Model | DeepSeek V4.1 Flash |
| Provider | `opencode-go` |
| Model ID | `opencode-go/deepseek-v4.1-flash` |
| Session id | `ses_e607f33aaffe8e4SA7JRy9ej1f` |
| Session start (UTC) | 2026-11-03T03:43:00.699Z (2026-11-02 19:43 local) |
| Release date | 2026-11-02 |
| Machine | macOS, Apple Silicon |
| Node (local) | 26.13.0 |
| Node (CI) | 22 |
| Chrome (headless) | 156.0.8078.79 |
| Runtime dependencies | none |
| Package manager | not used |

The session built the app, verified it, created the repository and Pages site, published v1.0.0, then added the professional documentation set and this reproduction record. Exact elapsed seconds and token counters are in [`state.json`](../state.json); they include cache reads and are intentionally not estimated elsewhere.

## 4. Tooling and services

- **OpenCode** for the agent session.
- **DeepSeek V4.1 Flash** for code, copy, design and verification.
- **GitHub** for source hosting, Actions, releases and Pages.
- **Google Chrome** headless over the DevTools Protocol for interaction tests.
- **Python 3** only as a local static file server.
- **Node.js** only for the local/CI verification suite.

No package registry, bundler, CDN, analytics, database or server-side runtime is used by the product.

## 5. Repository and deployment

| Item | Value |
|------|-------|
| Remote | `https://github.com/somphol/isometric-chess-academy.git` |
| Default branch | `main` |
| Pages source | `main` / `/` |
| Pages build type | legacy |
| `.nojekyll` | present |
| CI | `.github/workflows/ci.yml` |
| Release tag | `v1.0.0` |
| Release URL | <https://github.com/somphol/isometric-chess-academy/releases/tag/v1.0.0> |
| Live URL | <https://somphol.github.io/isometric-chess-academy/> |

### Commit outline

The main line of history is:

1. Initial source, docs skeleton, CI and assets.
2. `state.json` added and refreshed.
3. Promotion/clock polish.
4. Language isolation fix (English-only/Thai-only display).
5. Professional release documentation.
6. GitHub Actions version bumps (checkout v7, setup-node v7).
7. Reproduction book, ADR log, provenance and checksum manifest.

Use `git log --oneline --decorate` for the exact SHAs. The tag `v1.0.0` identifies the app release; documentation-only commits after the tag live on `main`.

## 6. Credentials and publishing

This machine has private GitHub credentials at:

- `~/.config/opencode-secrets/github.curl` — a curl config with the API authorization header.
- `~/.config/opencode-secrets/git-credentials` — a Git credential-store line for `github.com`.

The repository's local Git config points its credential helper at the store file:

```bash
git config --local credential.helper
# store --file=/Users/somphol/.config/opencode-secrets/git-credentials
```

Rules for a future agent:

- Use `curl --config ~/.config/opencode-secrets/github.curl` for API calls.
- Use `git -c credential.helper= -c credential.helper='store --file=...' push` or the local helper.
- **Never print, copy, commit or echo the credentials.**
- **Never read the macOS Keychain or use `git credential-osxkeychain`** unless the owner asks. Repeated prompts were explicitly undesirable.
- If the files are missing, ask the owner for a new credential; do not invent or hardcode a token.
- Do not commit `.env`, tokens, passwords or personal data.

These paths are machine-local. They are recorded here only so a future agent on the same machine knows where to look; they are not part of the public release.

## 7. Verification evidence

- `node --check script.js` passes.
- `node scripts/check.mjs` passes (87 checks at the time of the reproduction docs).
- `shasum -a 256 -c docs/MANIFEST.sha256` passes.
- Perft start position depths 1–4: `20 / 400 / 8902 / 197281`.
- Kiwipete depths 1–2: `48 / 2039`.
- Five puzzle FENs and expected moves validate; mate/check claims proven.
- Headless Chrome: pointer clicks, flipped-board clicks, promotion (white and black), en passant, castling, checkmate modal, blunder modal + undo, wrong puzzle move + hint + solve, EN/TH switch, localStorage reload, 390 px viewport.
- Visible-text scan: no Thai characters in English mode in the initial board, blunder modal or puzzle modal.
- GitHub Actions check workflow: green.
- GitHub Pages build: green; root, CSS, JS, state and screenshots return 200.

The full matrix and known gaps are in [TESTING](TESTING.md).

## 8. What was not done

- No computer opponent, online multiplayer, accounts or cloud storage.
- No PGN import.
- No multi-move puzzle lines.
- No native Thai review.
- No automated Safari/Firefox run.
- No full screen-reader grid for the Canvas.
- No custom CSP header (GitHub Pages limitation).
- No release after the documentation-only additions; v1.0.0 is the app release tag.

## 9. Integrity

The exact source and screenshot artifacts are listed in [MANIFEST.sha256](MANIFEST.sha256). If the hashes do not match, the working tree is not the released artifact; inspect the diff before trusting this documentation.

```bash
shasum -a 256 -c docs/MANIFEST.sha256
```

## 10. If this session is gone

1. Read [REPRODUCTION](REPRODUCTION.md) end to end.
2. Read [DECISIONS](DECISIONS.md) before changing a constraint.
3. Run the verification commands in §7.
4. Treat [`state.json`](../state.json) and the `v1.0.0` release as historical records, not configuration.
5. Keep the product **Western chess**, the interface **single-language**, and the runtime **dependency-free**.
6. Update [MANIFEST.sha256](MANIFEST.sha256), the changelog, the relevant guide and `state.json` when behaviour changes.
7. Do not publish anything from `~/.config/opencode-secrets` and do not trigger repeated Keychain prompts.

## 11. Related

- [REPRODUCTION](REPRODUCTION.md)
- [DECISIONS](DECISIONS.md)
- [ARCHITECTURE](ARCHITECTURE.md)
- [TESTING](TESTING.md)
- [RELEASE](RELEASE.md)
- [MANIFEST.sha256](MANIFEST.sha256)
