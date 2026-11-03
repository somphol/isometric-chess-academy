# Privacy

## Summary

The app has no accounts, no analytics, no advertising, no tracking pixels, no cookies set by the app, and no runtime network requests. Everything you do stays in your browser unless you explicitly export a file.

## What the app stores

In `localStorage` under the key `isometricChessAcademy.v1`:

| Data | Purpose |
|------|---------|
| Current casual game (move list, clocks, start FEN) | Resume after reload |
| Language, sound, learning mode, blunder guard, board flip | Restore preferences |
| Puzzle solved ids, current streak, best streak, attempts | Track practice |
| Games finished and blunders flagged | Local statistics |

This data is stored by your browser on your device. It is not sent anywhere by the app.

The app also keeps transient state in memory: selected square, legal moves, hover state, animation timers, current dialog and coach text. That state disappears when the page closes.

## What the app does not collect

- No names, email addresses, accounts or profiles.
- No analytics, telemetry, session recording or heatmaps.
- No advertising identifiers or third-party scripts.
- No microphone, camera, location, contacts or clipboard access.
- No cookies set by the application.
- No upload of games, puzzles, settings or exports.

## Exports

**Export PGN** and **Export JSON** create files in your browser and trigger a normal download. The app does not upload them. The JSON export contains the current position, move history, clocks, settings, puzzle progress and local statistics. It contains no device identifiers or personal data.

Treat exported files as you would any document: they may reveal your playing style or study habits to whoever you share them with.

## Hosting

The live site is served by **GitHub Pages**. GitHub may process standard HTTP request data (IP address, user agent, requested URL, timestamps) as part of hosting, security and abuse prevention. That processing is outside the app's control. See the [GitHub Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement).

The app itself does not read or transmit that data.

## Clearing your data

- Use **Clear saved data** in the sidebar footer to delete the app's `localStorage` entry and reset the game and puzzle streaks.
- Or clear site data for `somphol.github.io` in your browser settings.
- Private/incognito windows usually discard `localStorage` when closed.
- Clearing data is permanent; export a JSON copy first if you want a record.

Because storage belongs to an origin, progress saved on `https://somphol.github.io` is not visible on `file://` or on a future custom domain.

## Children

The app is suitable for classroom use and does not knowingly collect personal information from anyone, including children. There is no sign-in, chat, advertising or user-generated content upload.

## Changes

Material privacy changes will be recorded in [CHANGELOG.md](../CHANGELOG.md) and in this document. The app will not add analytics or tracking without an explicit, visible change to this policy.

## Contact

For a privacy question, open a regular GitHub issue **without personal information**. For a security or privacy vulnerability, use the private process in [SECURITY.md](../SECURITY.md).

## Related

- [SECURITY.md](../SECURITY.md)
- [SUPPORT.md](../SUPPORT.md)
- [docs/ARCHITECTURE.md](ARCHITECTURE.md) — storage schema
