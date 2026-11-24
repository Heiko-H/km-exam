import { describe, expect, it } from 'vitest';
import { mergeByModificationDate } from './dataStore';

describe('modification date merging', () => {
  it('keeps new local changes and retains untouched bundled entries', () => {
    const bundled = [
      { id: 'one', modification_date: '2026-01-01', text: 'old' },
      { id: 'two', modification_date: '2026-01-01', text: 'unchanged' },
    ];
    const local = [{ id: 'one', modification_date: '2026-02-01', text: 'local' }];

    expect(mergeByModificationDate(bundled, local)).toEqual([
      { id: 'one', modification_date: '2026-02-01', text: 'local' },
      { id: 'two', modification_date: '2026-01-01', text: 'unchanged' },
    ]);
  });
});