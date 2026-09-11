# Changelog

All notable changes to `@wyatt/starlight-katex` are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [SemVer](https://semver.org/) (0.x while pre-stable).

## [0.1.0] - Unreleased (publish pending 2FA)

Initial scoped release. Successor to `starlight-katex` (@stereobooster, unmaintained since October 2024) — rebuilt for Astro 5 / Starlight ≥ 0.30.

### Added

- Starlight plugin `starlightKatex()` — wires `remark-math`, `rehype-katex`, and MDX brace escaping into Starlight's markdown pipeline.
- MDX-safe brace escaping (`remarkEscapeBraces`): literal `{`/`}` escaped to `\{`/`\}`; LaTeX environment names (`\begin{cases}`, `\begin{aligned}`, `\begin{pmatrix}`, and 22 more) preserved intact; unicode placeholder round-tripping.
- Conditional KaTeX stylesheet injection: loads only on pages containing math, deduplicates `<link>` tags, survives Astro View Transitions (`astro:after-swap`). URL configurable via `cssUrl` (default: jsDelivr KaTeX 0.16.44).
- **Dark-mode KaTeX overrides** injected by default (`darkMode: true`): CSS custom properties (`--sl-katex-color`, `--sl-katex-display-bg`, `--sl-katex-display-border`) activated under `data-theme="dark"` and `prefers-color-scheme: dark`; gated on math presence like the stylesheet loader.
- Exported internals for custom pipelines: `remarkEscapeBraces`, `generateKatexCSSLoader`, `generateDarkModeStyleInjection`, `LATEX_ENV_NAMES`, `restorePlaceholders`, `escapeLiteralBraces`.
- Shippable raw stylesheet at `styles/katex-dark.css`.
- CI (GitHub Actions): typecheck + build + tests on Node 20/22.
- Test suite: markdown pipeline (inline/display math, all 25 LaTeX environments, placeholder restoration), plugin wiring, CSS loader generators.

### Changed

- Package published under the `@wyatt` scope (the unscoped `starlight-katex` name belongs to the earlier package).
- Peer dependencies raised to `astro >= 5.0.0`, `@astrojs/starlight >= 0.30.0`, `katex >= 0.16.0`.

### Fixed

- `darkMode` option was accepted but never applied — dark-mode CSS is now actually injected.
- Removed duplicate `license` key from `package.json`.
- **Critical:** the plugin passed its markdown config to Starlight's plugin `updateConfig`, which validates against the *Starlight* schema — the patch was silently discarded and math was never rendered. Markdown config is now applied through an added Astro integration (`astro:config:setup` → Astro `updateConfig`), verified end-to-end against a real Starlight build.
- `remark-math` / `rehype-katex` were referenced by name but never declared as dependencies — builds failed under pnpm's strict layout or whenever the user hadn't installed them. Both are now direct dependencies, and the imported functions are passed to Astro (no string resolution from the user's project).
- User-configured `markdown.remarkPlugins` / `rehypePlugins` are now preserved and merged instead of relying on Astro's replace-on-update semantics.

[0.1.0]: https://github.com/WyattAu/starlight-katex/compare/6a1ad23...HEAD
