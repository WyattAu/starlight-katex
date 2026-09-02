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
