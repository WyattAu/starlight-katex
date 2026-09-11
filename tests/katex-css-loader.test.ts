import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { generateKatexCSSLoader, generateDarkModeStyleInjection, DARK_MODE_STYLE_ID } from '../src/katex-css-loader.js';

const DEFAULT_URL = 'https://cdn.jsdelivr.net/npm/katex@0.16.44/dist/katex.min.css';

describe('generateKatexCSSLoader', () => {
  it('returns a string', () => {
    const result = generateKatexCSSLoader();
    expect(typeof result).toBe('string');
  });

  it('is a self-invoking function', () => {
    const result = generateKatexCSSLoader();
    expect(result.startsWith('(function(){')).toBe(true);
    expect(result.endsWith('})();')).toBe(true);
  });

  it('contains the default CDN URL', () => {
    const result = generateKatexCSSLoader();
    expect(result).toContain(DEFAULT_URL);
  });

  it('contains a .katex selector check', () => {
    const result = generateKatexCSSLoader();
    expect(result).toContain('.katex');
  });

  it('contains a .katex-display selector check', () => {
    const result = generateKatexCSSLoader();
    expect(result).toContain('.katex-display');
  });

  it('creates a link element with rel=stylesheet', () => {
    const result = generateKatexCSSLoader();
    expect(result).toContain('e.rel="stylesheet"');
  });

  it('includes the astro:after-swap event listener for View Transitions', () => {
    const result = generateKatexCSSLoader();
    expect(result).toContain('astro:after-swap');
  });

  it('uses a custom URL when provided', () => {
    const customUrl = 'https://example.com/katex.css';
    const result = generateKatexCSSLoader(customUrl);
    expect(result).toContain(customUrl);
    expect(result).not.toContain(DEFAULT_URL);
  });

  it('deduplicates by checking for existing link tag', () => {
    const result = generateKatexCSSLoader();
    expect(result).toContain('document.querySelector(');
    expect(result).toContain('link[href=');
  });

  it('is compact (under 500 chars with default URL)', () => {
    const result = generateKatexCSSLoader();
    expect(result.length).toBeLessThan(500);
  });
});

describe('generateDarkModeStyleInjection', () => {
  const css = readFileSync(new URL('../styles/katex-dark.css', import.meta.url), 'utf-8');

  it('returns a self-invoking function', () => {
    const result = generateDarkModeStyleInjection(css);
    expect(result.startsWith('(function(){')).toBe(true);
    expect(result.endsWith('})();')).toBe(true);
  });

  it('embeds the CSS text', () => {
    const result = generateDarkModeStyleInjection(css);
    expect(result).toContain('--sl-katex-color');
    expect(result).toContain('data-theme');
    expect(result).toContain('prefers-color-scheme: dark');
  });

  it('creates a style element with a stable id for dedupe', () => {
    const result = generateDarkModeStyleInjection(css);
    expect(result).toContain(JSON.stringify(DARK_MODE_STYLE_ID));
    expect(result).toContain('createElement("style")');
  });

  it('gates injection on the presence of rendered math', () => {
    const result = generateDarkModeStyleInjection(css);
    expect(result).toContain('.katex');
    expect(result).toContain('.katex-display');
  });

  it('re-applies after Astro View Transitions', () => {
    const result = generateDarkModeStyleInjection(css);
    expect(result).toContain('astro:after-swap');
  });

  it('JSON-escapes the CSS payload safely', () => {
    const tricky = 'a { content: "}"; }';
    const result = generateDarkModeStyleInjection(tricky);
    expect(result).toContain(JSON.stringify(tricky));
  });
});
