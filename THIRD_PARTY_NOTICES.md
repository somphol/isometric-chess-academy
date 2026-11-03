# Third-party notices

## Runtime dependencies

**None.** The application ships no npm packages, no JavaScript libraries, no CSS frameworks and no web fonts. It runs from the three source files:

- `index.html`
- `style.css`
- `script.js`

No remote scripts, stylesheets, images, fonts or audio are fetched at runtime.

## Artwork and audio

- The chess pieces, board tiles, slab, highlights and interface icons rendered on Canvas are original vector paths created for this project.
- Sound effects are synthesized at runtime with the Web Audio API. No audio files are bundled.
- The screenshots in `assets/` were generated from the application itself.
- The favicon is an inline SVG data URI created for this project.
- Emoji used in the interface (for example 🎓, 🧩, 💡 and ♞) are rendered by the user's operating system font, not bundled.

## Typography

The interface uses locally installed system font stacks:

- Avenir Next / Segoe UI / Helvetica Neue / system-ui
- Iowan Old Style / Palatino / Georgia
- Thonburi / Sukhumvit Set / Noto Sans Thai

No font files are distributed with this repository.

## Contributor Covenant

`CODE_OF_CONDUCT.md` is adapted from the **Contributor Covenant, version 2.1**, available at <https://www.contributor-covenant.org/version/2/1/code_of_conduct.html>.

The Contributor Covenant is licensed under the **Creative Commons Attribution 4.0 International** licence: <https://creativecommons.org/licenses/by/4.0/>.

## Keep a Changelog and Semantic Versioning

The changelog format references [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Their text is not bundled; the references are informational.

## Tooling

- Built with [OpenCode](https://opencode.ai) and **DeepSeek V4.1 Flash** (`opencode-go/deepseek-v4.1-flash`).
- Hosted by GitHub Pages.
- Verification uses Node.js built-ins and headless Google Chrome during development.

These tools are not runtime dependencies. Their names and marks belong to their respective owners.

## Licence

The project itself is released under the [MIT License](LICENSE). Third-party names are used descriptively and do not imply endorsement.
