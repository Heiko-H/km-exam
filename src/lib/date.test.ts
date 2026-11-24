import { describe, expect, it } from 'vitest';
import { formatDate } from './date';

describe('formatDate', () => {
  it('uses a written month and day-first order in English', () => {
    expect(formatDate('2026-11-24', 'en')).toBe('24 Nov 2026');
  });

  it('uses the selected language for the month abbreviation', () => {
    expect(formatDate('2026-11-24', 'de')).toContain('Nov');
    expect(formatDate('2026-11-24', 'fr').toLocaleLowerCase('fr')).toContain('nov');
  });

  it('returns malformed values unchanged', () => {
    expect(formatDate('not-a-date', 'de')).toBe('not-a-date');
  });
});