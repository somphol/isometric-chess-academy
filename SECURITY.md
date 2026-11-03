# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | Yes       |
| < 1.0   | No        |

The live site is built from the `main` branch. There is no server-side component, database, account system or API.

## Reporting a vulnerability

**Please do not open a public issue for a security problem.**

Use GitHub's private vulnerability reporting:

1. Open the repository's **Security** tab.
2. Choose **Advisories** → **Report a vulnerability**.
3. Include the affected browser/OS, the URL or `file://` path, reproduction steps, and any console output or screenshot.

If private advisories are unavailable, contact the maintainer **@somphol** through GitHub.

Please do not include real secrets, tokens, passwords or personal data in a report.

## What to expect

This is a single-maintainer open-source project. Best-effort targets:

- Acknowledgement within **72 hours**.
- Initial assessment within **7 days**.
- A fix or mitigation plan for confirmed issues as soon as practical.
- Credit in the advisory and changelog if you would like it.

These are targets, not contractual guarantees.

## Scope

In scope:

- Cross-site scripting or script injection reachable through normal use.
- Unsafe handling of `localStorage`, PGN/JSON export data, clipboard content or user-supplied text.
- Logic that could corrupt saved games or leak data between users on a shared browser profile.
- Supply-chain issues in the repository or CI workflow.
- Accessibility or privacy defects with a security impact.

Out of scope:

- Vulnerabilities in the browser, operating system or GitHub Pages infrastructure.
- Self-XSS that requires the user to paste code into DevTools.
- Denial of service through intentionally huge local files that the app does not import.
- Reports that require physical access to an unlocked device.
- Missing security headers controlled by GitHub Pages. The app sets no server headers; this is a hosting limitation.

## Design notes

- **No backend.** The app is static HTML, CSS and JavaScript served by GitHub Pages.
- **No network calls at runtime.** There are no analytics, CDNs, remote fonts, trackers or third-party scripts.
- **No accounts.** There is no sign-in, no server-side identity and no upload of game data.
- **Local data.** Games, settings and puzzle progress live in `localStorage` under `isometricChessAcademy.v1`.
- **Exports are local Blobs.** PGN and JSON downloads never leave the browser through the app.
- **Dependencies.** There are no runtime dependencies. CI uses pinned major versions of `actions/checkout` and `actions/setup-node`.
- **Content Security Policy.** GitHub Pages does not allow project-specific response headers on this deployment. The app avoids `eval`, remote code and inline event handlers.

## Safe harbor

Good-faith research that follows this policy, avoids privacy violations, avoids service disruption and does not access other users' data will not be pursued or reported. If in doubt, ask privately first.

## Related

- [PRIVACY.md](docs/PRIVACY.md) — what is and is not stored.
- [SUPPORT.md](SUPPORT.md) — ordinary bugs and usage questions.
