export function localFuzzySearch(query: string, cachedMemories: string[]): string[] {
  const q = query.toLowerCase();
  return cachedMemories.filter((memory) => memory.toLowerCase().includes(q));
}
