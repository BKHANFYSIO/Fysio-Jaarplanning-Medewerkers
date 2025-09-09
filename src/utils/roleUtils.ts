/**
 * Tokenize a free-form role string into individual role identifiers.
 *
 * Accepts delimiters such as comma, semicolon, slash, backslash, pipe,
 * ampersand, plus, and any newlines or tabs. Returns lower-cased, trimmed
 * unique tokens suitable for comparisons and filtering.
 */
export function tokenizeRoles(raw: unknown): string[] {
  const input = (raw ?? '').toString();

  if (!input.trim()) return [];

  // Normalize various delimiters to commas
  const normalized = input
    .replace(/[\r\n\t]+/g, ',')
    .replace(/[;|/\\&+]+/g, ',');

  // Split on commas, trim, lower-case, and de-duplicate
  const seen = new Set<string>();
  for (const piece of normalized.split(',')) {
    const token = piece.trim().toLowerCase();
    if (token) seen.add(token);
  }
  return Array.from(seen);
}


