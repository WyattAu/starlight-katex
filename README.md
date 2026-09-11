<div align="center">

# `@wyatt/starlight-katex`

**Beautiful, build-time math rendering for [Starlight](https://starlight.astro.build) — with MDX that doesn't explode.**

Write `$E = mc^2$` in any page. Get server-rendered KaTeX, automatic dark mode, and zero client-side JavaScript.

[![npm version](https://img.shields.io/npm/v/@wyatt/starlight-katex)](https://www.npmjs.com/package/@wyatt/starlight-katex)
[![license](https://img.shields.io/npm/l/@wyatt/starlight-katex)](./LICENSE)
[![CI](https://github.com/WyattAu/starlight-katex/actions/workflows/ci.yml/badge.svg)](https://github.com/WyattAu/starlight-katex/actions/workflows/ci.yml)

</div>

---

> **Successor to `starlight-katex`.** The original package by [@stereobooster](https://github.com/stereobooster) has been unmaintained since **October 2024** (last release v0.0.4, targeting Astro 4). This plugin is the actively maintained continuation — rebuilt for **Astro 5 / Starlight ≥ 0.30**, with MDX brace escaping and dark-mode support that the original lacked.

## Why this exists

Math in Starlight has two failure modes: LaTeX curly braces collide with MDX's JSX expression syntax, and KaTeX's default styling is unreadable in dark themes. This plugin fixes both — in one install, with zero configuration.

| | |
|---|---|
| **Σ KaTeX rendering** | Math is rendered at **build time** via `remark-math` + `rehype-katex`. No client runtime, no layout shift, no flash of unstyled LaTeX. |
| **🛡 MDX brace escaping** | Literal `{` / `}` in LaTeX are escaped so MDX never mistakes them for JSX expressions — `\frac{a}{b}` compiles cleanly in `.mdx` pages. LaTeX environment names (`\begin{cases}`, `\begin{aligned}`, …) are preserved intact. |
| **🌙 Dark-mode support** | Ships CSS overrides driven by `--sl-katex-*` custom properties. Activates under Starlight's `data-theme="dark"` and falls back to `prefers-color-scheme: dark`. Tune the colors with two CSS variables. |
| **🏗 SSR-safe** | Everything happens in the remark/rehype pipeline at build time. Nothing to hydrate, nothing to break with `output: 'server'` or View Transitions. |
| **⚡ Zero-config install** | One plugin entry. The KaTeX stylesheet is injected **only on pages that contain math** (~30 KB saved everywhere else), deduplicated, and re-applied across Astro View Transitions (`astro:after-swap`). |

## Installation

```bash
npm install @wyatt/starlight-katex
```

Peer dependencies (`astro`, `@astrojs/starlight`, `katex`) are installed automatically by npm ≥ 7. `remark-math` and `rehype-katex` ship as direct dependencies of this package — there is nothing else to install or configure.

## Setup — 3 steps

**1. Register the plugin** in `astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { starlightKatex } from '@wyatt/starlight-katex';

export default defineConfig({
  integrations: [
    starlight({
      plugins: [starlightKatex()],
    }),
  ],
});
```

**2. Write math** in any content page (`$…$` inline, `$$…$$` display):

```md
Euler's identity: $e^{i\pi} + 1 = 0$ — the most beautiful equation in mathematics.

$$
\int_{-\infty}^{\infty} e^{-x^2} \, dx = \sqrt{\pi}
$$
```

**3. That's it.** Build your site (`astro build`) and the math is rendered.

## What you get

Given the markdown above, your page renders:

- **Inline:** *Euler's identity: e<sup>iπ</sup> + 1 = 0* — typeset in KaTeX's serif math font, flowing with your text.
- **Display:** the Gaussian integral centered on its own line inside a `.katex-display` block — with a subtle background and hairline borders in dark mode, nothing in light mode.

All output is plain HTML + KaTeX CSS, rendered once at build time. Pages without math don't load any KaTeX assets at all.

Environments work out of the box — `aligned`, `cases`, `pmatrix`, `bmatrix`, `gather`, `equation`, `split`, and [22 more](src/utils.ts):

```md
$$
\begin{aligned}
  \nabla \cdot \mathbf{E} &= \frac{\rho}{\varepsilon_0} \\
  \nabla \cdot \mathbf{B} &= 0
\end{aligned}
$$
```

## Configuration

All options are optional — the defaults are sensible:

| Option | Type | Default | Description |
|---|---|---|---|
| `katexOptions` | `Record<string, unknown>` | `{}` | Options passed directly to [`rehype-katex`](https://github.com/remarkjs/rehype-katex#options) (e.g. `{ throwOnError: false }`, `macros`). |
| `cssUrl` | `string` | jsDelivr KaTeX **0.16.44** CSS | URL of the KaTeX stylesheet to inject. Point it at a self-hosted copy if you don't want a third-party CDN. |
| `darkMode` | `boolean` | `true` | Inject the dark-mode CSS overrides. Disable if you ship your own KaTeX theming. |

```js
starlightKatex({
  katexOptions: { throwOnError: false },
  darkMode: true,
})
```

For custom pipelines the internals are also exported: `remarkEscapeBraces`, `generateKatexCSSLoader`, `generateDarkModeStyleInjection`, `LATEX_ENV_NAMES`, `restorePlaceholders`, `escapeLiteralBraces`.

The raw stylesheet is also shipped at `styles/katex-dark.css` — import it directly (`@wyatt/starlight-katex/styles/katex-dark.css`) if you prefer to manage KaTeX theming yourself.

## FAQ

### Why do braces need escaping in MDX?

In `.mdx` files, `{anything}` is a **JSX expression container** — MDX evaluates it as JavaScript. LaTeX is full of literal braces (`\frac{a}{b}`, `\sum_{i=1}^{n}`), so without escaping, MDX tries to execute `a` as JavaScript and your build fails with a cryptic syntax error.

This plugin escapes literal braces to `\{` / `\}` — which KaTeX renders as actual brace glyphs — and recognizes LaTeX environment names (`\begin{cases}` …) so they pass through untouched. You never see any of this; it just works. In plain `.md` files braces are already safe, and the plugin is a no-op there.

### Which Starlight / Astro versions are supported?

- **Astro ≥ 5.0** and **Starlight ≥ 0.30** (peer dependencies, enforced on install).
- Tested against current Starlight 0.3x releases. The plugin only uses stable Starlight APIs (`plugins` array + markdown config), so minor updates are typically drop-in.

### Which KaTeX version?

The plugin peer-depends on **KaTeX ≥ 0.16** and injects the **0.16.44** stylesheet by default. Rendering is done by whatever `katex`/`rehype-katex` versions your lockfile resolves; pin or upgrade freely within 0.16.x, or self-host a different CSS build via `cssUrl`.

### Why the `@wyatt` scope?

The unscoped `starlight-katex` name on npm belongs to the earlier package (see the note at the top). This plugin is published as `@wyatt/starlight-katex` so there's no ambiguity about which package you're installing.

### Can I use this outside Starlight?

Yes — it's a standard Astro markdown configuration. Any Astro project can add the remark/rehype plugins directly; the Starlight wrapper is just convenience.

### Does it conflict with custom remark/rehype plugins?

No. The plugin appends `remark-math` + brace escaping **after** any plugins you've already configured in `markdown.remarkPlugins`, and `rehype-katex` after your rehype plugins — your pipeline keeps running, math support is layered on top.

## Migrating from `starlight-katex` (0.0.4)

1. `npm uninstall starlight-katex && npm install @wyatt/starlight-katex`
2. Update the import: `import { starlightKatex } from '@wyatt/starlight-katex'`
3. Remove any `astro-integration-kit`-based shims — this package has **zero runtime dependencies** besides `unist-util-visit`.

You gain Astro 5 compatibility, MDX brace escaping, and dark-mode support.

## Development

```bash
npm install
npm test         # vitest suite (markdown pipeline + plugin + CSS loader)
npm run typecheck
npm run build
```

## License

[MIT](./LICENSE) — includes work continued from `starlight-katex` by @stereobooster (MIT).
