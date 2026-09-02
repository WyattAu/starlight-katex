import type { Plugin } from 'unified';
import type { Root, RootContent, Text } from 'mdast';
import { visit } from 'unist-util-visit';
import { LATEX_ENV_NAMES, escapeLiteralBraces, restorePlaceholders } from './utils.js';

/** Internal symbol to mark text nodes restored from LaTeX env expression nodes. */
const LATEX_ENV_MARKER = Symbol('latexEnv');

interface MarkedText extends Text {
  [LATEX_ENV_MARKER]?: boolean;
}

/**
 * Remark plugin that escapes curly braces MDX would interpret as JSX expressions,
 * while preserving braces inside LaTeX math environments.
 *
 * Handles three cases:
 *
 * 1. **mdxTextExpression nodes** – MDX consumed `{expr}` as a JSX expression.
 *    - If `expr` is a known LaTeX environment name → restore as raw `{expr}`
 *      (these are part of `\begin{...}`/`\end{...}` in math blocks).
 *    - Otherwise → replace with `\{expr\}` so KaTeX sees literal braces.
 *
 * 2. **Placeholder nodes** – Preprocessing replaced `{`/`}` around LaTeX command
 *    arguments with unicode placeholders. Restore them after brace escaping.
 *
 * 3. **Remaining literal braces in text nodes** – Replace unescaped `{`/`}`
 *    with `\{`/`\}` which KaTeX renders as literal braces.
 *
 * Additionally restores placeholders inside `math` and `inlineMath` nodes,
 * including any pre-populated `hChildren` from mdast-util-math.
 */
export const remarkEscapeBraces: Plugin<void[], Root> = function remarkEscapeBraces() {
  return (tree: Root) => {
    const expressionReplacements: Array<{
      parent: { children: RootContent[] };
      index: number;
    }> = [];

    visit(tree, 'mdxTextExpression' as never, (node, index, parent) => {
      if (parent && typeof index === 'number') {
        expressionReplacements.push({
          parent: parent as { children: RootContent[] },
          index,
        });
      }
    });

    for (const { parent, index } of expressionReplacements) {
      const original = parent.children[index];
      const expr =
        original && 'value' in original && typeof (original as Text).value === 'string'
          ? ((original as Text).value as string)
          : '';

      if (LATEX_ENV_NAMES.has(expr.trim())) {
        const marked: MarkedText = {
          type: 'text',
          value: '{' + expr + '}',
          [LATEX_ENV_MARKER]: true,
        };
        (parent.children as RootContent[])[index] = marked as unknown as RootContent;
      } else {
        const escaped: Text = {
          type: 'text',
          value: '\\{' + expr + '\\}',
        };
        (parent.children as RootContent[])[index] = escaped as unknown as RootContent;
      }
    }

    visit(tree, 'text' as never, (node: unknown) => {
      const text = node as MarkedText;
      if (text[LATEX_ENV_MARKER]) return;

      if (typeof text.value !== 'string') return;

      text.value = escapeLiteralBraces(text.value);
      text.value = restorePlaceholders(text.value);
    });

    visit(tree, 'math' as never, restoreMathPlaceholders);
    visit(tree, 'inlineMath' as never, restoreMathPlaceholders);
  };
};

/**
 * Visitor that restores placeholder sequences in math / inlineMath nodes,
 * including any pre-populated `hChildren` produced by mdast-util-math.
 */
function restoreMathPlaceholders(node: unknown): void {
  const n = node as Record<string, unknown>;
  if (typeof n.value !== 'string') return;

  n.value = restorePlaceholders(n.value as string);

  const data = n.data as Record<string, unknown> | undefined;
  const hChildren = data?.hChildren;
  if (!Array.isArray(hChildren)) return;

  for (const child of hChildren) {
    const el = child as Record<string, unknown>;
    if (el.type === 'element' && Array.isArray(el.children)) {
      for (const textChild of el.children) {
        const tc = textChild as Record<string, unknown>;
        if (tc.type === 'text' && typeof tc.value === 'string') {
          tc.value = restorePlaceholders(tc.value as string);
        }
      }
    } else if (el.type === 'text' && typeof el.value === 'string') {
      el.value = restorePlaceholders(el.value as string);
    }
  }
}

export { LATEX_ENV_MARKER };
