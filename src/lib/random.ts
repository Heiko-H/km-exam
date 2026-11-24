import type { Category, Level, Technique } from './types';

export function levelOf(technique: { level?: Level; category?: Category }): Level | undefined {
  if (technique.level) return technique.level;
  const match = (technique.category as Category | undefined)?.match(/^level-([1-5])$/);
  return match ? Number(match[1]) as Level : undefined;
}

export interface SeedInputs {
  firstName: string;
  lastName: string;
  level: Level;
  candidateCount: number;
  date: string;
}

export function createSeedString(inputs: SeedInputs): string {
  return [inputs.firstName.trim(), inputs.lastName.trim(), inputs.level, inputs.candidateCount, inputs.date].join('|');
}

function createRandomGenerator(seedWords: Uint32Array): () => number {
  let [a, b, c, d] = seedWords;
  return () => {
    const result = Math.imul(a + b | 0, 1) + d | 0;
    d = d + 1 | 0;
    a = b ^ b >>> 9;
    b = c + (c << 3) | 0;
    c = c << 21 | c >>> 11;
    c = c + result | 0;
    return (result >>> 0) / 4_294_967_296;
  };
}

export function fisherYates<T>(items: readonly T[], random: () => number): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

export async function selectTechniques(
  techniques: readonly Technique[],
  counts: Record<Level, number>,
  inputs: SeedInputs,
): Promise<Technique[]> {
  const seed = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(createSeedString(inputs)));
  const seedView = new DataView(seed);
  const words = new Uint32Array(4);
  for (let index = 0; index < words.length; index += 1) {
    words[index] = seedView.getUint32(index * 4, false);
  }
  const random = createRandomGenerator(words);
  const selected: Technique[] = [];

  for (const level of [1, 2, 3, 4, 5] as const) {
    const available = techniques.filter((technique) => levelOf(technique) === level);
    const count = counts[level];
    if (!Number.isInteger(count) || count < 0 || count > available.length) {
      throw new Error(`Für Stufe ${level} ist eine ungültige Technikanzahl ausgewählt.`);
    }
    if (count > 0) selected.push(...fisherYates(available, random).slice(0, count));
  }

  return fisherYates(selected, random);
}

export function localDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}