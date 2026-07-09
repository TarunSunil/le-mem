export function normalizeEntityName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}
