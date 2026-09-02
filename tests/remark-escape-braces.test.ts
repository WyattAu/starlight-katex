import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeKatex from 'rehype-katex';
import { remarkEscapeBraces } from '../src/remark-escape-braces.js';
import { LATEX_ENV_NAMES, restorePlaceholders, escapeLiteralBraces } from '../src/utils.js';

async function processMarkdown(md: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkMath)
    .use(remarkEscapeBraces)
    .use(remarkRehype)
    .use(rehypeKatex)
    .use(rehypeStringify)
    .process(md);
  return String(result);
}

async function processToMdast(md: string) {
  const processor = unified()
    .use(remarkParse)
    .use(remarkMath)
    .use(remarkEscapeBraces);
  const tree = processor.parse(md);
  return processor.run(tree);
}

// ---------------------------------------------------------------------------
// 1. LaTeX environment names
// ---------------------------------------------------------------------------
describe('LATEX_ENV_NAMES', () => {
  it('contains all 25 required environment names', () => {
    expect(LATEX_ENV_NAMES.size).toBe(25);
  });

  it('includes core environments', () => {
    const required = [
      'aligned', 'align', 'align*', 'cases', 'gather', 'gather*',
      'pmatrix', 'bmatrix', 'vmatrix', 'matrix', 'array',
      'equation', 'equation*', 'split', 'multline', 'multline*',
      'flalign', 'flalign*', 'eqnarray', 'eqnarray*',
      'tabular', 'table', 'center', 'displaymath', 'CD',
    ];
    for (const name of required) {
      expect(LATEX_ENV_NAMES.has(name), `Missing env: ${name}`).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Placeholder restoration
// ---------------------------------------------------------------------------
describe('restorePlaceholders', () => {
  it('restores ⦃LB⦄ / ⦃RB⦄ placeholders', () => {
    expect(restorePlaceholders('\u29C3LB\u29C4x\u29C3RB\u29C4')).toBe('{x}');
  });

  it('restores ◆LB◆ / ◆RB◆ placeholders', () => {
    expect(restorePlaceholders('\u25C6LB\u25C6x\u25C6RB\u25C6')).toBe('{x}');
  });

  it('restores \\uE000 / \\uE001 placeholders', () => {
    expect(restorePlaceholders('\uE000x\uE001')).toBe('{x}');
  });

  it('restores mixed placeholder formats in one string', () => {
    const input = '\u29C3LB\u29C4a\u29C3RB\u29C4+\u25C6LB\u25C6b\u25C6RB\u25C6+\uE000c\uE001';
    expect(restorePlaceholders(input)).toBe('{a}+{b}+{c}');
  });

  it('leaves a string without placeholders unchanged', () => {
    expect(restorePlaceholders('hello world')).toBe('hello world');
  });

  it('restores multiple occurrences of the same placeholder', () => {
    const input = '\uE000a\uE001 + \uE000b\uE001';
    expect(restorePlaceholders(input)).toBe('{a} + {b}');
  });
});

// ---------------------------------------------------------------------------
// 3. Literal brace escaping
// ---------------------------------------------------------------------------
describe('escapeLiteralBraces', () => {
  it('escapes unescaped braces', () => {
    expect(escapeLiteralBraces('{x}')).toBe('\\{x\\}');
  });

  it('does not double-escape already escaped braces', () => {
    expect(escapeLiteralBraces('\\{x\\}')).toBe('\\{x\\}');
  });

  it('handles mixed escaped and unescaped braces', () => {
    expect(escapeLiteralBraces('{a}\\{b\\}{c}')).toBe('\\{a\\}\\{b\\}\\{c\\}');
  });

  it('leaves text without braces unchanged', () => {
    expect(escapeLiteralBraces('no braces here')).toBe('no braces here');
  });

  it('handles empty string', () => {
    expect(escapeLiteralBraces('')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// 4. remark-escape-braces plugin
// ---------------------------------------------------------------------------
describe('remarkEscapeBraces', () => {
  it('leaves plain markdown unchanged', async () => {
    const html = await processMarkdown('Hello **world**');
    expect(html).toContain('Hello');
    expect(html).toContain('<strong>world</strong>');
  });

  it('renders inline math with $ delimiters', async () => {
    const html = await processMarkdown('Inline $E = mc^2$ math');
    expect(html).toContain('katex');
    expect(html).toContain('E');
  });

  it('renders display math with $$ delimiters', async () => {
    const html = await processMarkdown('$$\n\\int_0^1 x \\, dx\n$$');
    expect(html).toContain('katex-display');
  });

  it('renders empty inline math', async () => {
    const html = await processMarkdown('$ $');
    expect(html).toContain('katex');
  });

  it('renders empty display math', async () => {
    const html = await processMarkdown('$$\n\n$$');
    expect(html).toContain('katex-display');
  });

  it('handles nested braces in math expressions', async () => {
    const html = await processMarkdown('$\\frac{a}{b}$');
    expect(html).toContain('katex');
    expect(html).toContain('frac');
  });

  it('does not re-escape already-escaped braces in text nodes', async () => {
    const md = 'Text with \\{escaped\\} braces';
    const tree = await processToMdast(md);
    const textNode = findTextNode(tree, 'Text with \\{escaped\\} braces');
    expect(textNode).toBeTruthy();
  });

  it('escapes unescaped curly braces in text', async () => {
    const md = 'Some {text} here';
    const tree = await processToMdast(md);
    const textNode = findTextNode(tree, 'Some \\{text\\} here');
    expect(textNode).toBeTruthy();
  });

  it('handles math with aligned environment', async () => {
    const html = await processMarkdown('$$\n\\begin{aligned}\na &= b\n\\end{aligned}\n$$');
    expect(html).toContain('katex-display');
    expect(html).toContain('aligned');
  });

  it('handles inline math with cases environment', async () => {
    const html = await processMarkdown('$\\begin{cases} x \\\\ y \\end{cases}$');
    expect(html).toContain('katex');
  });

  it('handles pmatrix environment', async () => {
    const html = await processMarkdown('$$\n\\begin{pmatrix}\n1 & 2 \\\\\n3 & 4\n\\end{pmatrix}\n$$');
    expect(html).toContain('katex-display');
  });

  it('handles bmatrix environment', async () => {
    const html = await processMarkdown('$$\n\\begin{bmatrix}\na & b\n\\end{bmatrix}\n$$');
    expect(html).toContain('katex-display');
  });

  it('handles vmatrix environment', async () => {
    const html = await processMarkdown('$$\n\\begin{vmatrix}\nx\n\\end{vmatrix}\n$$');
    expect(html).toContain('katex-display');
  });

  it('handles matrix environment', async () => {
    const html = await processMarkdown('$\\begin{matrix} a & b \\end{matrix}$');
    expect(html).toContain('katex');
  });

  it('handles array environment', async () => {
    const html = await processMarkdown('$$\n\\begin{array}{cc}\na & b\n\\end{array}\n$$');
    expect(html).toContain('katex-display');
  });

  it('handles gather environment', async () => {
    const html = await processMarkdown('$$\n\\begin{gather}\na = b\n\\end{gather}\n$$');
    expect(html).toContain('katex-display');
  });

  it('handles equation environment', async () => {
    const html = await processMarkdown('$$\n\\begin{equation}\nx = 1\n\\end{equation}\n$$');
    expect(html).toContain('katex-display');
  });

  it('handles split environment', async () => {
    const html = await processMarkdown('$$\n\\begin{split}\na &= b\n\\end{split}\n$$');
    expect(html).toContain('katex-display');
  });

  it('passes through multline environment (KaTeX may error)', async () => {
    const html = await processMarkdown('$$\n\\begin{multline}\na + b\n\\end{multline}\n$$');
    expect(html).toContain('multline');
  });

  it('passes through flalign environment (KaTeX may error)', async () => {
    const html = await processMarkdown('$$\n\\begin{flalign}\na &= b\n\\end{flalign}\n$$');
    expect(html).toContain('flalign');
  });

  it('passes through eqnarray environment (KaTeX may error)', async () => {
    const html = await processMarkdown('$$\n\\begin{eqnarray}\na &=& b\n\\end{eqnarray}\n$$');
    expect(html).toContain('eqnarray');
  });

  it('passes through displaymath environment (KaTeX may error)', async () => {
    const html = await processMarkdown('$$\n\\begin{displaymath}\nx^2\n\\end{displaymath}\n$$');
    expect(html).toContain('displaymath');
  });

  it('handles CD environment', async () => {
    const html = await processMarkdown('$\\begin{CD} A @>>> B \\end{CD}$');
    expect(html).toContain('katex');
  });
});

// ---------------------------------------------------------------------------
// 5. Placeholder restoration in math nodes
// ---------------------------------------------------------------------------
describe('remarkEscapeBraces – placeholder restoration in math', () => {
  it('restores circled placeholders in math node value', async () => {
    const md = '$\\text\u29C3LB\u29C4hello\u29C3RB\u29C4$';
    const tree = await processToMdast(md);
    const mathNode = findNode(tree, 'inlineMath');
    expect(mathNode).toBeTruthy();
    expect((mathNode as { value: string }).value).toBe('\\text{hello}');
  });

  it('restores diamond placeholders in math node value', async () => {
    const md = '$\\text\u25C6LB\u25C6hello\u25C6RB\u25C6$';
    const tree = await processToMdast(md);
    const mathNode = findNode(tree, 'inlineMath');
    expect(mathNode).toBeTruthy();
    expect((mathNode as { value: string }).value).toBe('\\text{hello}');
  });

  it('restores PUA placeholders in math node value', async () => {
    const md = '$\\text\uE000hello\uE001$';
    const tree = await processToMdast(md);
    const mathNode = findNode(tree, 'inlineMath');
    expect(mathNode).toBeTruthy();
    expect((mathNode as { value: string }).value).toBe('\\text{hello}');
  });

  it('restores placeholders in display math', async () => {
    const md = '$$\n\\text\u29C3LB\u29C4hello\u29C3RB\u29C4\n$$';
    const tree = await processToMdast(md);
    const mathNode = findNode(tree, 'math');
    expect(mathNode).toBeTruthy();
    expect((mathNode as { value: string }).value).toBe('\\text{hello}');
  });
});

// ---------------------------------------------------------------------------
// 6. Math nodes with hChildren
// ---------------------------------------------------------------------------
describe('remarkEscapeBraces – hChildren restoration', () => {
  it('restores placeholders in hChildren text nodes', () => {
    const tree = unified()
      .use(remarkParse)
      .use(remarkMath)
      .parse('$x$');

    const inlineMath = findNode(tree, 'inlineMath') as Record<string, unknown>;
    expect(inlineMath).toBeTruthy();

    inlineMath.data = {
      hChildren: [
        { type: 'text', value: '\u29C3LB\u29C4restored\u29C3RB\u29C4' },
      ],
    };

    const plugin = remarkEscapeBraces as () => (tree: unknown) => void;
    plugin()(tree);

    const hChildren = (inlineMath.data as Record<string, unknown>).hChildren as Array<Record<string, unknown>>;
    expect(hChildren[0].value).toBe('{restored}');
  });

  it('restores placeholders in hChildren element → text nodes', () => {
    const tree = unified()
      .use(remarkParse)
      .use(remarkMath)
      .parse('$x$');

    const inlineMath = findNode(tree, 'inlineMath') as Record<string, unknown>;
    inlineMath.data = {
      hChildren: [
        {
          type: 'element',
          children: [
            { type: 'text', value: '\uE000inner\uE001' },
          ],
        },
      ],
    };

    const plugin = remarkEscapeBraces as () => (tree: unknown) => void;
    plugin()(tree);

    const hChildren = (inlineMath.data as Record<string, unknown>).hChildren as Array<Record<string, unknown>>;
    const element = hChildren[0] as { children: Array<Record<string, unknown>> };
    expect(element.children[0].value).toBe('{inner}');
  });

  it('handles math node without hChildren gracefully', () => {
    const tree = unified()
      .use(remarkParse)
      .use(remarkMath)
      .parse('$x$');

    const inlineMath = findNode(tree, 'inlineMath') as Record<string, unknown>;
    inlineMath.data = {};

    const plugin = remarkEscapeBraces as () => (tree: unknown) => void;
    plugin()(tree);

    expect((inlineMath as { value: string }).value).toBe('x');
  });
});

// ---------------------------------------------------------------------------
// 7. Full pipeline: remark-math → escape-braces → rehype-katex
// ---------------------------------------------------------------------------
describe('full rendering pipeline', () => {
  it('renders inline math to HTML with katex class', async () => {
    const html = await processMarkdown('The value is $x = 42$.');
    expect(html).toContain('class="katex"');
  });

  it('renders display math to HTML with katex-display class', async () => {
    const html = await processMarkdown('$$\nx = 42\n$$');
    expect(html).toContain('katex-display');
  });

  it('renders multiple inline math expressions', async () => {
    const html = await processMarkdown('$a$ and $b$ and $c$');
    const matches = html.match(/class="katex"/g);
    expect(matches).toHaveLength(3);
  });

  it('handles complex math expression', async () => {
    const html = await processMarkdown('$\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$');
    expect(html).toContain('katex');
    expect(html).toContain('sum');
  });

  it('handles greek letters', async () => {
    const html = await processMarkdown('$\\alpha + \\beta = \\gamma$');
    expect(html).toContain('katex');
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findNode(tree: unknown, type: string): Record<string, unknown> | null {
  const node = tree as Record<string, unknown>;
  if (node.type === type) return node;
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      const found = findNode(child, type);
      if (found) return found;
    }
  }
  return null;
}

function findTextNode(tree: unknown, value: string): { value: string } | null {
  const node = tree as Record<string, unknown>;
  if (node.type === 'text' && node.value === value) {
    return node as { value: string };
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      const found = findTextNode(child, value);
      if (found) return found;
    }
  }
  return null;
}
