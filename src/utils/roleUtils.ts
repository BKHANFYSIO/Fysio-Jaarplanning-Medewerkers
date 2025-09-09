export function extractNormalizedRoles(input: string | null | undefined): string[] {
  if (!input) return [];
  const normalized = String(input)
    .replace(/[\u00A0]/g, ' ') // normalize non-breaking spaces
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) return [];

  // Split on common separators: comma, semicolon, pipe, slash
  const primaryParts = normalized
    .split(/[;,\/|]+/g)
    .flatMap(part => part.split(/\s+en\s+/i)) // also split on " en "
    .map(p => p.trim())
    .filter(Boolean);

  // Lowercase and de-duplicate
  const unique = new Set(primaryParts.map(p => p.toLowerCase()))
  return Array.from(unique);
}

export function formatRoleLabel(roleKey: string): string {
  const key = roleKey.trim();
  if (/^[a-z]{1,4}$/i.test(key)) {
    return key.toUpperCase();
  }
  return key.charAt(0).toUpperCase() + key.slice(1);
}


