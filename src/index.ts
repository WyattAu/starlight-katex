import { readFileSync } from 'node:fs';
import type { AstroIntegration } from 'astro';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { remarkEscapeBraces } from './remark-escape-braces.js';
import { generateKatexCSSLoader, generateDarkModeStyleInjection } from './katex-css-loader.js';

/**
 * Options for the `starlight-katex` plugin.
 */
export interface StarlightKatexOptions {
  /**
   * Additional options passed directly to `rehype-katex`.
   * See https://github.com/remarkjs/rehype-katex#options
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

/** Load the bundled dark-mode stylesheet from `styles/katex-dark.css`. */
function loadDarkModeCSS(): string {
  const cssUrl = new URL('../styles/katex-dark.css', import.meta.url);
  return readFileSync(cssUrl, 'utf-8');
}

/**
 * Starlight plugin that adds KaTeX math rendering with MDX compatibility.
 *
 * Usage in `astro.config.mjs`:
 *
 * ```js
 * import { defineConfig } from 'astro/config';
 * import starlight from '@astrojs/starlight';
 * import { starlightKatex } from '@wyatt/starlight-katex';
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
      addIntegration: (integration: AstroIntegration) => void;
    }) => void;
  };
} {
  const { katexOptions, cssUrl, darkMode = true } = options;

  return {
    name: 'starlight-katex',
    hooks: {
      setup({ addIntegration }) {
        const injectedScripts = [generateKatexCSSLoader(cssUrl)];

        if (darkMode) {
          injectedScripts.push(generateDarkModeStyleInjection(loadDarkModeCSS()));
        }

        addIntegration({
          name: 'starlight-katex-inject',
          hooks: {
            'astro:config:setup'({
              config,
              updateConfig,
              injectScript,
            }: {
              config: {
                markdown?: {
                  remarkPlugins?: unknown[];
                  rehypePlugins?: unknown[];
                };
              };
              updateConfig: (patch: Record<string, unknown>) => void;
              injectScript: (stage: string, content: string) => void;
            }) {
              // Preserve any remark/rehype plugins the user configured,
              // then append math rendering and brace escaping after them.
              const remarkPlugins = [
                ...(config.markdown?.remarkPlugins ?? []),
                [remarkMath],
                [remarkEscapeBraces],
              ];
              const rehypePlugins = [
                ...(config.markdown?.rehypePlugins ?? []),
                [rehypeKatex, katexOptions ?? {}],
              ];

              updateConfig({
                markdown: { remarkPlugins, rehypePlugins },
              });

              for (const script of injectedScripts) {
                injectScript('head-inline', script);
              }
            },
          },
        } as AstroIntegration);
      },
    },
  };
}

export { remarkEscapeBraces } from './remark-escape-braces.js';
export {
  generateKatexCSSLoader,
  generateDarkModeStyleInjection,
  DARK_MODE_STYLE_ID,
} from './katex-css-loader.js';
export { LATEX_ENV_NAMES, restorePlaceholders, escapeLiteralBraces } from './utils.js';
