import type { AstroIntegration } from 'astro';
import { remarkEscapeBraces } from './remark-escape-braces.js';
import { generateKatexCSSLoader } from './katex-css-loader.js';

/**
 * Options for the `starlight-katex` plugin.
 */
export interface StarlightKatexOptions {
  /**
   * Additional options passed directly to `rehype-katex`.
   * See https://github.com/remarkjs/rehype-kathex#options
   */
  katexOptions?: Record<string, unknown>;
  /**
   * CDN URL for the KaTeX stylesheet.
   * @default "https://cdn.jsdelivr.net/npm/katex@0.16.44/dist/katex.min.css"
   */
  cssUrl?: string;
  /**
   * Whether to inject dark-mode KaTeX CSS overrides.
   * @default true
   */
  darkMode?: boolean;
}

/**
 * Starlight plugin that adds KaTeX math rendering with MDX compatibility.
 *
 * Usage in `astro.config.mjs`:
 *
 * ```js
 * import { defineConfig } from 'astro/config';
 * import starlight from '@astrojs/starlight';
 * import starlightKatex from 'starlight-katex';
 *
 * export default defineConfig({
 *   integrations: [
 *     starlight({
 *       plugins: [starlightKatex()],
 *     }),
 *   ],
 * });
 * ```
 */
export function starlightKatex(
  options: StarlightKatexOptions = {},
): {
  name: string;
  hooks: {
    setup: (config: {
      config: Record<string, unknown>;
      updateConfig: (patch: Record<string, unknown>) => void;
      addIntegration: (integration: AstroIntegration) => void;
    }) => void;
  };
} {
  const { katexOptions, cssUrl, darkMode = true } = options;

  return {
    name: 'starlight-katex',
    hooks: {
      setup({ updateConfig, addIntegration }) {
        const loaderScript = generateKatexCSSLoader(cssUrl);

        updateConfig({
          markdown: {
            remarkPlugins: [['remark-math'], [remarkEscapeBraces]],
            rehypePlugins: [['rehype-katex', katexOptions ?? {}]],
          },
        });

        addIntegration({
          name: 'starlight-katex-inject',
          hooks: {
            'astro:config:setup'({
              injectScript,
            }: {
              injectScript: (stage: string, content: string) => void;
            }) {
              injectScript('head-inline', loaderScript);
            },
          },
        } as AstroIntegration);
      },
    },
  };
}

export { remarkEscapeBraces } from './remark-escape-braces.js';
export { generateKatexCSSLoader } from './katex-css-loader.js';
export { LATEX_ENV_NAMES, restorePlaceholders, escapeLiteralBraces } from './utils.js';
