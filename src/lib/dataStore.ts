export function mergeByModificationDate<T extends { id: string; modification_date: string }>(
  bundled: readonly T[],
  local: readonly T[],
): T[] {
  const merged = new Map(bundled.map((item) => [item.id, item]));
  for (const item of local) {
    const bundledItem = merged.get(item.id);
    if (!bundledItem || item.modification_date > bundledItem.modification_date) merged.set(item.id, item);
  }
  return [...merged.values()];
}