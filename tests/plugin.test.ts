import { describe, it, expect } from 'vitest';
import { starlightKatex } from '../src/index.js';

interface HookArgs {
  config: {
    markdown?: {
      remarkPlugins?: unknown[];
      rehypePlugins?: unknown[];
    };
  };
  updateConfig: (patch: Record<string, unknown>) => void;
  injectScript: (stage: string, content: string) => void;
}

/** Drive the plugin through Starlight's setup hook and the added Astro integration. */
function runPlugin(
  options: Parameters<typeof starlightKatex>[0] = {},
  userConfig: HookArgs['config'] = {},
): { integrations: unknown[]; updates: Record<string, unknown>[]; injections: Array<{ stage: string; content: string }> } {
  const plugin = starlightKatex(options);
  const integrations: unknown[] = [];

  plugin.hooks.setup({
    addIntegration: (integration) => { integrations.push(integration); },
  });

  const updates: Record<string, unknown>[] = [];
  const injections: Array<{ stage: string; content: string }> = [];

  for (const integration of integrations) {
    const hooks = (integration as unknown as Record<string, unknown>).hooks as Record<string, unknown>;
    const configSetup = hooks['astro:config:setup'] as (args: HookArgs) => void;
    configSetup({
      config: userConfig,
      updateConfig: (patch) => { updates.push(patch); },
      injectScript: (stage, content) => { injections.push({ stage, content }); },
    });
  }

  return { integrations, updates, injections };
}

describe('starlightKatex plugin', () => {
  it('returns a plugin object with name "starlight-katex"', () => {
    const plugin = starlightKatex();
    expect(plugin.name).toBe('starlight-katex');
  });

  it('has a hooks.setup function', () => {
    const plugin = starlightKatex();
    expect(typeof plugin.hooks.setup).toBe('function');
  });

  it('adds one Astro integration during setup', () => {
    const { integrations } = runPlugin();
    expect(integrations.length).toBe(1);
    expect((integrations[0] as { name: string }).name).toBe('starlight-katex-inject');
  });

  it('integration has astro:config:setup hook', () => {
    const { integrations } = runPlugin();
    const hooks = (integrations[0] as unknown as Record<string, unknown>).hooks as Record<string, unknown>;
    expect(typeof hooks['astro:config:setup']).toBe('function');
  });

  it('calls updateConfig with remark and rehype plugins', () => {
    const { updates } = runPlugin();

    expect(updates.length).toBeGreaterThanOrEqual(1);

    const mdConfig = updates[0].markdown as Record<string, unknown>;
    expect(mdConfig).toBeDefined();
    expect(mdConfig.remarkPlugins).toBeDefined();
    expect(mdConfig.rehypePlugins).toBeDefined();

    const remarkPlugins = mdConfig.remarkPlugins as unknown[];
    expect(remarkPlugins.length).toBe(2);

    const rehypePlugins = mdConfig.rehypePlugins as unknown[];
    expect(rehypePlugins.length).toBe(1);
  });

  it('preserves user-configured remark and rehype plugins', () => {
    const userRemark = function userRemark() {};
    const userRehype = function userRehype() {};
    const { updates } = runPlugin({}, {
      markdown: {
        remarkPlugins: [userRemark],
        rehypePlugins: [userRehype],
      },
    });

    const mdConfig = updates[0].markdown as Record<string, unknown>;
    const remarkPlugins = mdConfig.remarkPlugins as unknown[];
    const rehypePlugins = mdConfig.rehypePlugins as unknown[];

    expect(remarkPlugins.length).toBe(3);
    expect(remarkPlugins[0]).toBe(userRemark);
    // math + brace escaping run after user plugins
    expect(remarkPlugins[remarkPlugins.length - 2]).toEqual([expect.any(Function)]);
    expect(remarkPlugins[remarkPlugins.length - 1]).toEqual([expect.any(Function)]);

    expect(rehypePlugins.length).toBe(2);
    expect(rehypePlugins[0]).toBe(userRehype);
  });

  it('passes katexOptions to rehype-katex', () => {
    const { updates } = runPlugin({ katexOptions: { strict: false } });

    const mdConfig = updates[0].markdown as Record<string, unknown>;
    const rehypePlugins = mdConfig.rehypePlugins as unknown[][];
    expect(rehypePlugins[0][1]).toEqual({ strict: false });
  });

  it('uses default options when none provided', () => {
    const { updates } = runPlugin();

    const mdConfig = updates[0].markdown as Record<string, unknown>;
    const rehypePlugins = mdConfig.rehypePlugins as unknown[][];
    expect(rehypePlugins[0][1]).toEqual({});
  });

  it('integration injects head-inline scripts', () => {
    const { injections } = runPlugin();

    expect(injections.length).toBe(2);
    for (const { stage, content } of injections) {
      expect(stage).toBe('head-inline');
      expect(content).toContain('katex');
      expect(content).toContain('astro:after-swap');
    }
  });

  it('injects dark-mode overrides by default', () => {
    const { injections } = runPlugin();

    const dark = injections.find(({ content }) => content.includes('sl-katex-dark'));
    expect(dark).toBeTruthy();
    expect(dark!.content).toContain('--sl-katex-color');
    expect(dark!.content).toContain('data-theme');
  });

  it('skips dark-mode injection when darkMode is false', () => {
    const { injections } = runPlugin({ darkMode: false });

    expect(injections.length).toBe(1);
    expect(injections[0].content).not.toContain('sl-katex-dark');
  });

  it('uses custom cssUrl in generated script', () => {
    const { injections } = runPlugin({ cssUrl: 'https://custom.cdn/katex.css' });

    expect(injections.some(({ content }) => content.includes('https://custom.cdn/katex.css'))).toBe(true);
    expect(injections.some(({ content }) => content.includes('katex@0.16.44'))).toBe(false);
  });
});

describe('exports', () => {
  it('exports starlightKatex as default-like function', () => {
    expect(typeof starlightKatex).toBe('function');
  });

  it('re-exports remarkEscapeBraces', async () => {
    const mod = await import('../src/index.js');
    expect(typeof mod.remarkEscapeBraces).toBe('function');
  });

  it('re-exports generateKatexCSSLoader', async () => {
    const mod = await import('../src/index.js');
    expect(typeof mod.generateKatexCSSLoader).toBe('function');
  });

  it('re-exports generateDarkModeStyleInjection', async () => {
    const mod = await import('../src/index.js');
    expect(typeof mod.generateDarkModeStyleInjection).toBe('function');
  });

  it('re-exports DARK_MODE_STYLE_ID', async () => {
    const mod = await import('../src/index.js');
    expect(typeof mod.DARK_MODE_STYLE_ID).toBe('string');
  });

  it('re-exports LATEX_ENV_NAMES', async () => {
    const mod = await import('../src/index.js');
    expect(mod.LATEX_ENV_NAMES).toBeInstanceOf(Set);
  });

  it('re-exports restorePlaceholders', async () => {
    const mod = await import('../src/index.js');
    expect(typeof mod.restorePlaceholders).toBe('function');
  });

  it('re-exports escapeLiteralBraces', async () => {
    const mod = await import('../src/index.js');
    expect(typeof mod.escapeLiteralBraces).toBe('function');
  });
});
