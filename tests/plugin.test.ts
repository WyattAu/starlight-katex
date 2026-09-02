import { describe, it, expect } from 'vitest';
import { starlightKatex } from '../src/index.js';

describe('starlightKatex plugin', () => {
  it('returns a plugin object with name "starlight-katex"', () => {
    const plugin = starlightKatex();
    expect(plugin.name).toBe('starlight-katex');
  });

  it('has a hooks.setup function', () => {
    const plugin = starlightKatex();
    expect(typeof plugin.hooks.setup).toBe('function');
  });

  it('calls updateConfig with remark and rehype plugins', () => {
    const plugin = starlightKatex();
    const updates: Record<string, unknown>[] = [];

    plugin.hooks.setup({
      config: {},
      updateConfig: (patch) => { updates.push(patch as Record<string, unknown>); },
      addIntegration: () => {},
    });

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

  it('calls addIntegration for CSS injection', () => {
    const plugin = starlightKatex();
    const integrations: unknown[] = [];

    plugin.hooks.setup({
      config: {},
      updateConfig: () => {},
      addIntegration: (integration) => { integrations.push(integration); },
    });

    expect(integrations.length).toBe(1);
    const integration = integrations[0] as { name: string };
    expect(integration.name).toBe('starlight-katex-inject');
  });

  it('passes katexOptions to rehype-katex', () => {
    const plugin = starlightKatex({ katexOptions: { strict: false } });
    const updates: Record<string, unknown>[] = [];

    plugin.hooks.setup({
      config: {},
      updateConfig: (patch) => { updates.push(patch as Record<string, unknown>); },
      addIntegration: () => {},
    });

    const mdConfig = updates[0].markdown as Record<string, unknown>;
    const rehypePlugins = mdConfig.rehypePlugins as unknown[][];
    expect(rehypePlugins[0][1]).toEqual({ strict: false });
  });

  it('uses default options when none provided', () => {
    const plugin = starlightKatex();
    const updates: Record<string, unknown>[] = [];

    plugin.hooks.setup({
      config: {},
      updateConfig: (patch) => { updates.push(patch as Record<string, unknown>); },
      addIntegration: () => {},
    });

    const mdConfig = updates[0].markdown as Record<string, unknown>;
    const rehypePlugins = mdConfig.rehypePlugins as unknown[][];
    expect(rehypePlugins[0][1]).toEqual({});
  });

  it('integration has astro:config:setup hook', () => {
    const plugin = starlightKatex();
    const integrations: unknown[] = [];

    plugin.hooks.setup({
      config: {},
      updateConfig: () => {},
      addIntegration: (integration) => { integrations.push(integration); },
    });

    const integration = integrations[0] as Record<string, unknown>;
    const hooks = integration.hooks as Record<string, unknown>;
    expect(typeof hooks['astro:config:setup']).toBe('function');
  });

  it('integration injects head-inline script', () => {
    const plugin = starlightKatex();
    let injectedStage = '';
    let injectedContent = '';

    plugin.hooks.setup({
      config: {},
      updateConfig: () => {},
      addIntegration: (integration) => {
        const hooks = (integration as unknown as Record<string, unknown>).hooks as Record<string, unknown>;
        const setup = hooks['astro:config:setup'] as (args: {
          injectScript: (stage: string, content: string) => void;
        }) => void;
        setup({
          injectScript: (stage, content) => {
            injectedStage = stage;
            injectedContent = content;
          },
        });
      },
    });

    expect(injectedStage).toBe('head-inline');
    expect(injectedContent).toContain('katex');
    expect(injectedContent).toContain('astro:after-swap');
  });

  it('uses custom cssUrl in generated script', () => {
    const plugin = starlightKatex({ cssUrl: 'https://custom.cdn/katex.css' });
    let injectedContent = '';

    plugin.hooks.setup({
      config: {},
      updateConfig: () => {},
      addIntegration: (integration) => {
        const hooks = (integration as unknown as Record<string, unknown>).hooks as Record<string, unknown>;
        const setup = hooks['astro:config:setup'] as (args: {
          injectScript: (stage: string, content: string) => void;
        }) => void;
        setup({
          injectScript: (_stage, content) => { injectedContent = content; },
        });
      },
    });

    expect(injectedContent).toContain('https://custom.cdn/katex.css');
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
