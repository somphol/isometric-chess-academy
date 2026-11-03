# Design

## Intent

The studio should feel like a quiet wooden chess table in a modern study: dark, warm, unhurried and legible. The board is the hero; the coach is a patient person at the side, not a dashboard.

Primary audience: a beginner who knows how the pieces move but loses pieces without seeing why. Secondary audience: a teacher or club host who needs one page that works offline and switches language instantly.

## Design principles

1. **The board owns the screen.** Every panel earns its width. No modal covers the board unless the move cannot continue without an answer (promotion, blunder choice, game end).
2. **Colour is a promise.** Cyan always means selection, emerald always means a legal destination, amber always means the last move or a caution, coral always means danger. Never reuse them decoratively.
3. **Teach, do not scold.** Copy names the problem and the next question. It never calls a move stupid.
4. **Two languages, one voice.** Only the selected language is shown. A language switch must not leave a mixed sentence behind.
5. **Motion explains.** Pulse dots travel from the selected piece to its destinations. The animation is short and can be disabled by `prefers-reduced-motion`.
6. **Offline is a feature.** System fonts, Canvas paths and synthesized audio. Nothing waits for a CDN.

## Visual system

### Palette

Contrast ratios below are measured against the panel surface `#111d28`, not against a browser default.

| Token | Hex | Role | Contrast |
|-------|-----|------|----------|
| `--bg` | `#070d13` | Page base | 16.98:1 with `--text` |
| `--panel` | `#111d28` | Sidebar and cards | — |
| `--text` | `#e9f0f7` | Primary copy | 14.85:1 |
| `--muted` | `#93a6b8` | Secondary copy | 6.82:1 |
| `--muted-2` | `#6f8296` | Micro-labels, captions | 4.32:1 — see accessibility |
| `--cyan` | `#00e5ff` | Selection, focus, primary action | 11.10:1 |
| `--emerald` | `#00e676` | Legal moves, success, learning on | 10.23:1 |
| `--amber` | `#ffc857` | Last move, tips, point value | 11.10:1 |
| `--coral` | `#ff6b6b` | Check, danger, low clock | 6.15:1 |
| board light | `#cdb68f` | Warm wood tile | — |
| board dark | `#3b4f60` | Slate tile | — |

White pieces use a dark outline (`#5a472b`) and a shadow so they remain legible on the light wood tiles; the fill itself is not relied on for contrast. Dark pieces use a light rim and a strong shadow.

### Typography

- **UI:** `Avenir Next`, `Segoe UI`, `Helvetica Neue`, system-ui. No download, no layout shift.
- **Display:** `Iowan Old Style`, `Palatino`, Georgia for the brand, panel headings and clock numerals. It gives the studio a print-like calm without a web font.
- **Thai:** `Thonburi`, `Sukhumvit Set`, `Noto Sans Thai`, system-ui. Thai line-height is slightly looser and the font size is nudged up because Thai stacks vowels and tone marks.
- **Numerals:** tabular figures for clocks and move numbers.

### Spacing and shape

- 4 px base rhythm; 7–15 px inside cards; 14–26 px between major regions.
- Radii: 10–13 px for controls, 18 px for cards, 22–24 px for the board and sidebar.
- Borders are 1 px, low-contrast; depth comes from gradients, inner highlights and a single large shadow. Avoid stacking multiple heavy shadows.
- The dark grid behind the page is decorative and masked away from the centre; it should never compete with the board.

## Board design

- Tiles are diamonds from a fixed isometric projection (`TH = 0.62 × TW`).
- Light tiles read as warm wood with a light grain; dark tiles read as blue-slate with sparse speckle. Texture is deterministic per square, never animated noise.
- The board slab is extruded by `0.22 × TW`, with the lower-left and lower-right faces darker than the top.
- File and rank labels sit outside the playable diamond in a low-contrast small caps treatment.
- Pieces are original vector silhouettes with a plinth, a carved under-extrusion, a vertical gradient and a soft contact shadow. The king's cross is gold; it is the only non-palette accent on the piece set.
- Draw order is by screen `baseY` so pieces in front overlap pieces behind. The last-move glow is under the piece, never over it.

### Interaction states

| State | Treatment |
|-------|-----------|
| Hover | Soft blue wash + thin blue edge |
| Selected | Cyan wash, 2.4 px cyan edge, 18 px glow |
| Legal move | Emerald dot at 42–64% opacity; capture uses an emerald ring |
| Path animation | Two travelling dots per destination, 0.9 s cycle, sine lift |
| Last move | Amber wash on origin and destination |
| Check | Coral wash + pulsing coral edge on the king |
| Keyboard cursor | Dashed cyan diamond, only when the canvas has focus |
| Capture | 420 ms amber ring at the destination |

## Motion

- Piece movement: 260 ms, ease-in-out, sine lift of `0.24 × TW`.
- Pulse dots: continuous, slow, low opacity. They should read as breathing, not as a loading spinner.
- Modals: 240 ms upward fade and 2% scale.
- Toasts: 3 s, top centre, no interaction blocking.
- `prefers-reduced-motion` collapses CSS animation and transition durations to near zero. The Canvas pulse dots and piece animation are JavaScript-driven and are **not** currently gated by that media query; this is a known gap tracked in [ACCESSIBILITY.md](ACCESSIBILITY.md).

## Pedagogy

### Coach voice

- One idea per message.
- Ask a question the player can answer at the board ("Is this piece safe on its new square?").
- Prefer a concrete square or piece ("The knight on f6 attacks d7 and g8").
- Never shame. Never say "obviously", "simply", "just", or "you should have".
- When the player is winning, teach conversion. When losing, teach defence and a safe structure.

### Blunder guard

The guard is a heuristic, not an engine. It checks only three beginner-relevant failures:

1. A moved piece worth 3+ points is attacked by a cheaper piece and undefended.
2. A moved piece worth 5+ points is losing an exchange.
3. The move allows mate in one.

This keeps the false-positive rate low and the explanation short. The pop-up always offers **Undo & learn** and never blocks the player who wants to keep the move.

### Puzzle ladder

| Level | Puzzle | Teaching target |
|-------|--------|-----------------|
| 1 | Back-rank mate | King safety and luft |
| 1 | Ladder mate | Rook coordination |
| 1 | Save the bishop | Capture the attacker |
| 2 | Royal fork | Checks that win material |
| 2 | Bring the king home | Castling as development |

Difficulty is about the idea, not the number of pieces. Each puzzle ends with a lesson, not a score.

### Language

- English is the default; Thai is a first-class interface language.
- Only the selected language is visible. The inactive coach line is hidden with `html[lang]` CSS; dialogs render one language and re-render on toggle.
- Thai copy uses standard Thai chess vocabulary where it is widely understood, and keeps piece names familiar to beginners.
- Short labels avoid stacked tone marks; body copy allows them.

## Thai glossary

| English | Thai | Note |
|---------|------|------|
| Chess | หมากรุก | General term |
| King | ราชา | Also คิง in casual speech |
| Queen | ควีน | |
| Rook | เรือ | Literally boat; standard Thai chess term |
| Bishop | บิชอป | |
| Knight | อัศวิน | |
| Pawn | เบี้ย | |
| Check | ถูกเช็ค | |
| Checkmate | รุกจน | |
| Stalemate | จนแต้ม | |
| Castling | เข้าปราสาท | |
| En passant | กินเบี้ยผ่านทาง | |
| Promotion | เลื่อนขั้น | |
| Centre | ช่องกลาง | |
| Blunder | หมากพลาด | |

## Copy rules

Do:

- "Your knight on f7 can be captured by the king. Nothing is defending it."
- "Control the four centre squares: e4, d4, e5 and d5."
- "Move undone. Look for a safer idea."

Do not:

- "That was a terrible move."
- "Just castle, it's obvious."
- Mix an English sentence and a Thai sentence in the same visible paragraph.

## Constraints

- No web fonts, remote images, icon packs or audio files.
- No framework or CSS library.
- No colour as the only signal: selection also has an edge glow, captures have a ring, check has a pulse and a status label.
- The board must remain usable on a 390 px viewport and at 200% browser zoom.
- The ten-minute clock is a teaching device, not a tournament clock. It pauses while a modal is open.

## Review checklist

- Does the board still read at a glance with 32 pieces?
- Is every colour used for its semantic meaning?
- Does English mode contain zero Thai characters, and vice versa?
- Is every control reachable by keyboard, with a visible focus ring?
- Is the smallest text still readable at 390 px?
- Does the app work with sound off, storage blocked and reduced motion on?
- Does a new string exist in both dictionaries and in the correct voice?

## Related

- [ARCHITECTURE.md](ARCHITECTURE.md)
- [ACCESSIBILITY.md](ACCESSIBILITY.md)
- [TESTING.md](TESTING.md)
