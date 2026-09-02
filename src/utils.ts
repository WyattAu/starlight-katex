/** Known LaTeX environment names used in \begin{...}/\end{...} blocks. */
export const LATEX_ENV_NAMES: ReadonlySet<string> = new Set([
  'aligned', 'align', 'align*', 'cases', 'gather', 'gather*',
  'pmatrix', 'bmatrix', 'vmatrix', 'matrix', 'array',
  'equation', 'equation*', 'split', 'multline', 'multline*',
  'flalign', 'flalign*', 'eqnarray', 'eqnarray*',
  'tabular', 'table', 'center', 'displaymath', 'CD',
]);

/** Unicode placeholder for left brace: ⦃LB⦄ */
export const PLACEHOLDER_LB_CIRCLED = '\u29C3LB\u29C4';
/** Unicode placeholder for right brace: ⦃RB⦄ */
export const PLACEHOLDER_RB_CIRCLED = '\u29C3RB\u29C4';
/** Unicode placeholder for left brace: ◆LB◆ */
export const PLACEHOLDER_LB_DIAMOND = '\u25C6LB\u25C6';
/** Unicode placeholder for right brace: ◆RB◆ */
export const PLACEHOLDER_RB_DIAMOND = '\u25C6RB\u25C6';
/** Unicode private-use placeholder for left brace */
export const PLACEHOLDER_LB_PUA = '\uE000';
/** Unicode private-use placeholder for right brace */
export const PLACEHOLDER_RB_PUA = '\uE001';

const PLACEHOLDER_MAP: ReadonlyArray<[RegExp, string]> = [
  [new RegExp(escapeRegex(PLACEHOLDER_LB_CIRCLED), 'g'), '{'],
  [new RegExp(escapeRegex(PLACEHOLDER_RB_CIRCLED), 'g'), '}'],
  [new RegExp(escapeRegex(PLACEHOLDER_LB_PUA), 'g'), '{'],
  [new RegExp(escapeRegex(PLACEHOLDER_RB_PUA), 'g'), '}'],
  [new RegExp(escapeRegex(PLACEHOLDER_LB_DIAMOND), 'g'), '{'],
  [new RegExp(escapeRegex(PLACEHOLDER_RB_DIAMOND), 'g'), '}'],
];

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Restore all placeholder sequences back to literal `{` and `}` characters.
 *
 * Supports ⦃LB⦄/⦃RB⦄, ◆LB◆/◆RB◆, and \uE000/\uE001 formats.
 */
export function restorePlaceholders(str: string): string {
  let result = str;
  for (const [pattern, replacement] of PLACEHOLDER_MAP) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

/**
 * Escape unescaped curly braces in a string by prefixing them with backslash.
 *
 * Braces that are already escaped (preceded by `\`) are left untouched.
 */
export function escapeLiteralBraces(str: string): string {
  return str
    .replace(/(?<!\\)\{/g, '\\{')
    .replace(/(?<!\\)\}/g, '\\}');
}
