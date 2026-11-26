import { describe, expect, it } from 'vitest';
import { createSeedString, fisherYates, selectExamTechniques, selectTechniques } from './random';
import type { Level, Technique } from './types';

const techniques: Technique[] = [
  { id: 'a', level: 1, category: 'level-1', tags: [], modification_date: '2026-11-24', title: 'A', text: 'A' },
  { id: 'b', level: 1, category: 'level-1', tags: [], modification_date: '2026-11-24', title: 'B', text: 'B' },
  { id: 'c', level: 1, category: 'level-1', tags: [], modification_date: '2026-11-24', title: 'C', text: 'C' },
  { id: 'd', level: 2, category: 'level-2', tags: [], modification_date: '2026-11-24', title: 'D', text: 'D' },
  { id: 'e', level: 2, category: 'level-2', tags: [], modification_date: '2026-11-24', title: 'E', text: 'E' },
];
const counts: Record<Level, number> = { 1: 2, 2: 1, 3: 0, 4: 0, 5: 0 };
const seed = { firstName: 'Ada', lastName: 'Lovelace', level: 2 as const, candidateCount: 4, date: '2026-11-13' };

describe('deterministic technique selection', () => {
  it('builds the seed from all required fields', () => {
    expect(createSeedString(seed)).toBe('Ada|Lovelace|2|4|2026-11-13');
  });

  it('returns the same order for identical input and the requested count per level', async () => {
    const first = await selectTechniques(techniques, counts, seed);
    const second = await selectTechniques(techniques, counts, seed);
    expect(first.map((item) => item.text)).toEqual(second.map((item) => item.text));
    expect(first).toHaveLength(3);
    expect(first.filter((item) => item.level === 1)).toHaveLength(2);
    expect(first.filter((item) => item.level === 2)).toHaveLength(1);
    expect(new Set(first.map((item) => item.text)).size).toBe(3);
  });

  it('rejects counts above the available number of techniques', async () => {
    await expect(selectTechniques(techniques, { ...counts, 1: 4 }, seed)).rejects.toThrow('Stufe 1');
  });

  it('selects exam techniques deterministically from location, date, level and sequence', async () => {
    const inputs = { location: 'Dojo Berlin', date: '2026-12-01', level: 2 as const, sequence: 1 };
    const first = await selectExamTechniques(techniques, counts, inputs);
    const again = await selectExamTechniques(techniques, counts, inputs);
    expect(first.map((item) => item.id)).toEqual(again.map((item) => item.id));
    expect(first).toHaveLength(3);
  });

  it('shuffles a copy and preserves every item', () => {
    const original = [1, 2, 3, 4];
    const shuffled = fisherYates(original, () => 0.5);
    expect(original).toEqual([1, 2, 3, 4]);
    expect(shuffled).toHaveLength(4);
    expect([...shuffled].sort()).toEqual(original);
  });
});