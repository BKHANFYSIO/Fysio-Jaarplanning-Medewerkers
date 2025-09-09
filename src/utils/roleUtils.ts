// Utility helpers for role parsing/formatting used across filters and admin UI

/**
 * Extract a normalized list of roles from a free-form string.
 * Supports comma/semicolon/slash separated lists and trims/normalizes casing.
 */
export function extractNormalizedRoles(input: string | null | undefined): string[] {
  if (!input) return [];
  // Split only on comma or semicolon. Do NOT split on slash because some labels contain '/'
  const tokens = String(input)
    .split(/[;,]+/)
    .map(token => token.trim())
    .filter(token => token.length > 0);

  // Normalize to lowercase for comparison/filtering consistency
  return Array.from(new Set(tokens.map(token => token.toLowerCase())));
}

/**
 * Format a role label for display (capitalize words, collapse whitespace).
 */
export function formatRoleLabel(role: string): string {
  const cleaned = String(role).trim().replace(/\s+/g, ' ');
  // Simple title-case without locale specifics
  return cleaned.replace(/\b([a-z])(\w*)/gi, (_m, first: string, rest: string) => first.toUpperCase() + rest.toLowerCase());
}

/**
 * Normalize arbitrary header text to a safe identifier key.
 */
export function normalizeHeaderToId(header: string): string {
  return String(header)
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Convert a normalized id back into a user-friendly label.
 */
export function formatIdToLabel(id: string): string {
  const cleaned = String(id).replace(/_/g, ' ').trim();
  return cleaned.replace(/\b([a-z])(\w*)/gi, (_m, f: string, r: string) => f.toUpperCase() + r.toLowerCase());
}


