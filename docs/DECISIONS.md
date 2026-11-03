# Architecture decisions

This is a lightweight ADR log. Each entry records a decision that is expensive to reverse or easy to undo accidentally. For the current implementation, see [ARCHITECTURE](ARCHITECTURE.md).

---

## ADR-001 — Standard international chess, not Makruk

**Status:** accepted

**Context:** The commissioning brief mentioned bilingual chess and Thai language support, but the product owner explicitly required classic Western chess.

**Decision:** Implement FIDE-style international chess. Thai is an interface language only. No Makruk pieces, no Thai chess starting array, no Thai counting rules.

**Consequences:** All rules, puzzles, documentation and tests assume international chess. The rule is stated in the README, AGENTS, `state.json` and tests. Any Makruk adaptation must be a separate project.

---

## ADR-002 — Three static files, no build step

**Status:** accepted

**Context:** The brief required vanilla HTML5, CSS3, ES6 and Canvas, optimized for GitHub Pages.

**Decision:** Ship `index.html`, `style.css`, `script.js`, with no package manager, bundler, transpiler or runtime dependency. The only Node use is the local verification suite.

**Consequences:** The app works from `file://`, Pages or any static host. There is no tree-shaking or minification. Contributors must respect the three-file surface and avoid framework creep. CI can run without `npm install`.

---

## ADR-003 — Fixed 2.5D isometric projection

**Status:** accepted

**Context:** "2.5D/3D" could mean WebGL, an orbitable camera or a flat board with shadows.

**Decision:** Render a fixed isometric diamond on a 2D Canvas. `TH = 0.62 × TW`; a1 is the bottom corner, h8 the top. A flip maps `(f,r) → (7−f,7−r)`.

**Consequences:** The board has a distinctive look, but there is no orbit or perspective. Click mapping, piece draw order and hit testing are all coupled to this projection. Changing `TH`, origin or flip handling requires retesting pointer clicks in both orientations.

---

## ADR-004 — Canvas vector pieces with no image assets

**Status:** accepted

**Context:** The brief asked for stylized vector sprites, soft shadows and no external assets.

**Decision:** Draw six original piece silhouettes as Canvas paths, with a plinth, under-extrusion, gradient, outline and contact shadow. Scale by `TW / 106`.

**Consequences:** No image loading, no licensing, crisp at any DPI. Piece art is code, so visual changes require Canvas work and new screenshots. White pieces need a dark outline to stay legible on wood tiles.

---

## ADR-005 — Only the selected language is visible

**Status:** accepted (supersedes the initial side-by-side coach)

**Context:** The first build displayed English and Thai coach lines together. The product owner asked not to mix Thai into the English UI.

**Decision:** English mode hides Thai; Thai mode hides English. CSS hides the inactive coach line, and dialogs render only `UI.lang`. `setLanguage` re-renders an open learn, puzzle or end dialog.

**Consequences:** The interface is calmer and fully translated, but the "bilingual feedback box" is no longer simultaneous. The toggle is the way to see the other language. Automated checks scan visible text for cross-language leakage.

---

## ADR-006 — Blunder guard is a heuristic, not an engine

**Status:** accepted

**Context:** A beginner needs a short explanation, not a deep variation tree.

**Decision:** After a move, check hanging pieces, losing exchanges and allowed mate-in-one. Explain in one or two sentences and offer undo. Do not build a search engine or evaluation bar.

**Consequences:** Fast and understandable, but tactically shallow. It can miss defended resources or quiet positional errors. Copy must say "risky", not "losing".

---

## ADR-007 — Single-move puzzle drills

**Status:** accepted

**Context:** The brief asked for five beginner puzzles loaded from local JSON.

**Decision:** Each puzzle has a FEN, one expected move, and optional mate/check claims. Wrong legal moves are rejected before commit. There are no scripted black replies.

**Consequences:** Puzzles are easy to author and validate, and the engine remains the judge. They teach pattern recognition, not calculation. Multi-move drills are a future feature.

---

## ADR-008 — Replay saved moves instead of trusting a saved FEN

**Status:** accepted

**Context:** A saved FEN alone would lose SAN, captured pieces and castling-right history.

**Decision:** Store the move list and replay it through the engine on load. The stored FEN is informational. A corrupt move aborts restore and starts a fresh game.

**Consequences:** Restore is slightly slower but produces a consistent history and legal state. Schema changes require migration or a storage-key bump.

---

## ADR-009 — Cached static board and silhouette hit testing

**Status:** accepted

**Context:** Redrawing 64 gradients and textures every frame is wasteful; rectangular piece hit boxes stole clicks from tiles behind pieces.

**Decision:** Render ambient, slab, tiles and coordinates once into an offscreen Canvas; rebuild on resize/flip. Hit-test pieces with a tapered silhouette and fall back to tile mapping.

**Consequences:** Animation stays smooth. The cache must be invalidated on resize and flip. Hit testing is approximate but matches the visible silhouette better than a box.

---

## ADR-010 — No runtime network and no third-party services

**Status:** accepted

**Context:** Classroom/offline use, privacy and the zero-dependency requirement.

**Decision:** No CDN, fonts, analytics, remote images, APIs or service worker. Audio is synthesized, icons are inline/emoji, screenshots are local.

**Consequences:** Works offline, no consent banner, no data collection. Hosting logs remain a GitHub Pages concern. Security headers cannot be customized on Pages.

---

## ADR-011 — GitHub Pages from the repository root

**Status:** accepted

**Context:** The app is static and the repository is public.

**Decision:** Serve `main` / `/` with `.nojekyll`. No build artifact, no `gh-pages` branch.

**Consequences:** A push is a deploy. Rollback is a revert. A custom domain changes the origin and therefore localStorage visibility. CI checks are separate from Pages deployment.

---

## ADR-012 — Stored Git credentials, never Keychain prompts

**Status:** accepted for this machine

**Context:** The owner asked to avoid repeated macOS Keychain prompts during publishing.

**Decision:** Use the existing credential files under `~/.config/opencode-secrets` with `curl --config` and a local Git `credential.helper=store --file=...`. Do not read the Keychain or print tokens.

**Consequences:** Publishing works without prompts. The files are machine-local and must never be committed. Future agents must follow the same path or use their own secure credential store.

---

## ADR-013 — Documentation is part of the release gate

**Status:** accepted

**Context:** A single-page app is easy to demo but hard to hand off. The owner asked for a professional release and a complete reproduction record.

**Decision:** Require a documentation index, architecture, design, testing, deployment, accessibility, release, privacy, puzzle and FAQ guides; contributing, conduct, security, support, roadmap, citation and third-party notices; GitHub templates; and this ADR/ reproduction/ provenance set. CI validates required files and relative links.

**Consequences:** More maintenance, but a future agent can reconstruct and verify the project. Docs must be updated when behaviour changes. `state.json` remains historical, not runtime configuration.

---

## ADR-014 — Artifact checksums and historical state

**Status:** accepted

**Context:** Documentation alone cannot prove the source matches the release.

**Decision:** Keep SHA-256 checksums for the three source files and screenshots in `docs/MANIFEST.sha256`; CI verifies them. Keep the build session, tokens and deployment in `state.json` as a historical record.

**Consequences:** Any source or screenshot change requires a manifest update. The release is auditable. `state.json` must never be loaded by the app or silently refreshed to hide history.

---

## Adding a decision

Add a new numbered ADR when a change:

- alters the ruleset or product identity,
- changes the projection, storage schema or release contract,
- adds a dependency or a network call,
- changes the language-isolation policy,
- changes the public deployment model.

Keep it short: context, decision, consequences. Update the related docs and the changelog in the same change.
