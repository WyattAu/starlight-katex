/** Default KaTeX CSS CDN URL. */
const DEFAULT_KATEX_CSS_URL =
  'https://cdn.jsdelivr.net/npm/katex@0.16.44/dist/katex.min.css';

/**
 * Generate an inline JavaScript snippet that conditionally loads the KaTeX CSS
 * stylesheet only when the page actually contains rendered math.
 *
 * The script:
 * - Checks for `.katex` or `.katex-display` elements before injecting the
 *   stylesheet (avoids loading ~30 KB of CSS on pages without math).
 * - Deduplicates – won't add the same `<link>` twice.
 * - Handles Astro View Transitions via the `astro:after-swap` event.
 *
 * @param cssUrl - CDN URL for the KaTeX stylesheet. Defaults to jsDelivr.
 * @returns A string of JavaScript suitable for inline `<script>` injection.
 */
export function generateKatexCSSLoader(cssUrl: string = DEFAULT_KATEX_CSS_URL): string {
  const url = JSON.stringify(cssUrl);
  return `(function(){var u=${url};function l(){if(!document.querySelector(".katex-display")&&!document.querySelector(".katex"))return;if(document.querySelector('link[href="'+u+'"]'))return;var e=document.createElement("link");e.rel="stylesheet";e.href=u;document.head.appendChild(e)}l();document.addEventListener("astro:after-swap",l)})();`;
}

/** DOM id given to the injected dark-mode `<style>` element. */
export const DARK_MODE_STYLE_ID = 'sl-katex-dark';

/**
 * Generate an inline JavaScript snippet that injects the dark-mode KaTeX
 * overrides as a `<style>` element, only when the page contains rendered math.
 *
 * The script:
 * - Checks for `.katex` / `.katex-display` elements before injecting.
 * - Deduplicates by element id (see {@link DARK_MODE_STYLE_ID}).
 * - Handles Astro View Transitions via the `astro:after-swap` event.
 *
 * @param css - Dark-mode CSS text (the contents of `styles/katex-dark.css`).
 * @returns A string of JavaScript suitable for inline `<script>` injection.
 */
export function generateDarkModeStyleInjection(css: string): string {
  const styleId = DARK_MODE_STYLE_ID;
  const cssLiteral = JSON.stringify(css);
  return `(function(){var c=${cssLiteral};function l(){if(!document.querySelector(".katex-display")&&!document.querySelector(".katex"))return;if(document.getElementById(${JSON.stringify(styleId)}))return;var e=document.createElement("style");e.id=${JSON.stringify(styleId)};e.textContent=c;document.head.appendChild(e)}l();document.addEventListener("astro:after-swap",l)})();`;
}
