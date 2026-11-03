# Accessibility

## Position

The project aims at **WCAG 2.2 AA** for the surrounding interface, with a candid exception: the chess board itself is a Canvas application and is not fully operable or understandable by screen-reader users yet. This document records what is implemented, what is verified, and what is still missing. It is not a certification.

## Implemented

### Structure and navigation

- Landmarks: header, main, aside, footer, and a visible-on-focus **Skip to the board** link.
- Tabs use `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls` and labelled panels.
- Modals use `role="dialog"`, `aria-modal="true"` and `aria-labelledby`.
- The board canvas is focusable (`tabindex="0"`), has `role="application"` and a translated `aria-label` that includes the last move.
- The coach card and toast are `aria-live="polite"` status regions.
- Buttons have visible text or a translated `aria-label`; the sound and language controls expose state.

### Keyboard

| Key | Action |
|-----|--------|
| `Tab` / `Shift+Tab` | Move through controls and panels |
| Arrow keys | Move the board cursor |
| `Enter` / `Space` | Select a piece or play the highlighted move |
| `Esc` | Clear the selection, or close an informational dialog |
| `Enter` on a tab | Activate the tab |
| `Esc` in promotion | Does not dismiss; a promotion choice is required |

The canvas cursor is drawn as a dashed cyan diamond only when the canvas has focus. Selecting a piece shows its legal destinations, which can be reached with arrow keys and `Enter`.

### Colour and focus

- Every interactive control has a 2 px cyan `:focus-visible` outline with a 3 px offset.
- Selection is not colour-only: it has a bright edge and glow. Captures use a ring, not only a dot.
- Check is indicated by a pulsing coral tile **and** the status tag text "Check" / "ถูกเช็ค" **and** the coach line.
- The dark theme is intentional; the primary text is 14.85:1 against the panel, secondary text 6.82:1.

### Motion and sound

- `prefers-reduced-motion: reduce` collapses CSS animations and transitions.
- Sound is optional and starts on; the speaker toggle is always available and has an accessible label.
- No information is delivered by sound alone.

### Text and zoom

- The layout is fluid and uses `clamp()` for the brand title.
- At 390 px the board, clocks, controls and sidebar stack; `scrollWidth` was verified equal to the viewport width.
- The layout uses normal reflow and long Thai labels wrap rather than truncate; 200% zoom has not been formally tested.
- `lang="th"` switches to Thai typography and line heights.

## Known gaps

1. **Canvas semantics.** A screen reader sees one labelled application, not 64 squares and 32 pieces. There is no grid role, per-square accessible name, or move announcement beyond the last SAN in the canvas label.
2. **No focus trap in dialogs.** Focus moves to the first action when a dialog opens, but `Tab` can leave the dialog and reach the page behind it. `Esc` closes the informational dialogs; promotion requires a choice.
3. **Reduced motion is CSS-only.** The Canvas render loop continues to animate pulse dots and piece movement. Users who request reduced motion may still see motion on the board.
4. **Low-contrast micro-labels.** `--muted-2` (`#6f8296`) measures 4.32:1 on the panel surface, below the 4.5:1 AA threshold for normal text. It is used for small captions and labels, not body copy.
5. **White pieces on wood.** The fill alone is 1.89:1 against the light tiles. Legibility depends on the dark outline and shadow; this should be tested at low vision and in bright sunlight.
6. **No high-contrast or forced-colors mode.** Windows High Contrast / forced-colors has not been tested.
7. **No automated axe/Lighthouse run** is committed. The accessibility review was manual and functional.
8. **Thai screen-reader pronunciation** has not been tested with a native Thai voice.

## Verification performed

- Keyboard-only pass: skip link, tab order, board arrow cursor, Enter to select/move, Escape to clear, tab switching.
- Focus-visible outline on all buttons, tabs, switch and canvas.
- Language switch updates `html lang`, visible strings and dialog text.
- 390 × 844 viewport with no horizontal overflow.
- Reduced-motion media query inspected in DevTools (CSS transitions collapse; Canvas motion remains).
- Contrast calculated for the core palette; values recorded in [DESIGN.md](DESIGN.md).
- Semantic structure inspected in the accessibility tree (landmarks, tabs, dialogs, live regions).

## Recommended next steps

1. Add a visually hidden, keyboard-navigable 8×8 grid with per-square labels and piece descriptions, synchronized with the canvas.
2. Add a focus trap and `inert` background handling for modal dialogs.
3. Gate Canvas animation on `prefers-reduced-motion` and provide a static-highlight mode.
4. Raise `--muted-2` or restrict it to decorative text only.
5. Run axe-core and Lighthouse, record results in this file, and add a CI check.
6. Test with VoiceOver (macOS/iOS), NVDA (Windows) and a native Thai voice.
7. Test Windows forced-colors and 200% zoom on a 1366×768 display.

## Reporting an accessibility issue

Open a **bug report** with the `accessibility` label and include:

- The assistive technology and version (or "keyboard only").
- Browser and OS.
- The step where the interface becomes unclear or unreachable.
- Whether language was English or Thai.

If the issue is also a security concern, use [SECURITY.md](../SECURITY.md) instead.

## Related

- [DESIGN.md](DESIGN.md) — palette and motion rationale
- [TESTING.md](TESTING.md) — regression matrix
- [SUPPORT.md](../SUPPORT.md) — general help
