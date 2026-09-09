# @wyatt/starlight-katex

Starlight plugin for KaTeX math rendering with MDX compatibility.

Adds KaTeX support to Starlight's Markdown/MDX pipeline: `$inline$` and `$$display$$` math are rendered with KaTeX at build time, with literal `{`/`}` braces escaped so expressions survive MDX compilation, plus automatic KaTeX stylesheet loading and dark-mode color overrides.

> **Why the `@wyatt` scope?** The unscoped `starlight-katex` name on npm belongs to an unrelated package. This plugin is published as `@wyatt/starlight-katex`.

## Features

- **KaTeX via remark/rehype** — math is rendered at build time, no client runtime
- **MDX-safe** — literal braces in LaTeX are escaped so MDX doesn't treat them as JSX expressions
- **Stylesheet loading** — injects the KaTeX CSS from CDN (configurable URL)
- **Dark mode support** — CSS custom-property overrides under `[data-theme="dark"]` and `prefers-color-scheme: dark`

## Installation

```bash
npm install @wyatt/starlight-katex
# peer deps (auto-installed by npm ≥7):
#   katex, @astrojs/starlight, astro
```

## Usage

```js
// astro.config.mjs
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

Then write math in any content page:

```md
Euler's identity: $e^{i\pi} + 1 = 0$

$$
\int_{-\infty}^{\infty} e^{-x^2} \, dx = \sqrt{\pi}
$$
```

## Configuration options

All options are optional:

| Option | Type | Default | Description |
|---|---|---|---|
| `katexOptions` | `Record<string, unknown>` | `{}` | Options passed directly to `rehype-katex` |
| `cssUrl` | `string` | jsDelivr KaTeX 0.16.44 CSS | URL of the KaTeX stylesheet to inject |
| `darkMode` | `boolean` | `true` | Inject dark-mode KaTeX CSS overrides |

The internals are also exported for custom pipelines: `remarkEscapeBraces`, `generateKatexCSSLoader`, `LATEX_ENV_NAMES`, `restorePlaceholders`, `escapeLiteralBraces`.

## License

MIT
