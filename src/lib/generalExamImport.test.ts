import { describe, expect, it } from 'vitest';
import { parseGeneralExamsJson } from './generalExamImport';

const exam = {
  id: 'alpha',
  name: 'Alpha',
  level: 2,
  techniqueIds: ['technique-1'],
  modification_date: '2026-11-24T12:00:00.000Z',
};

describe('general exam import', () => {
  it('accepts a valid exam date and legacy records without a date', () => {
    expect(parseGeneralExamsJson(JSON.stringify([{ ...exam, date: '2026-12-01' }]))[0].date).toBe('2026-12-01');
    expect(parseGeneralExamsJson(JSON.stringify([exam]))[0].date).toBeUndefined();
  });

  it('rejects malformed or impossible exam dates', () => {
    expect(() => parseGeneralExamsJson(JSON.stringify([{ ...exam, date: '2026-12' }]))).toThrow('Invalid general exam.');
    expect(() => parseGeneralExamsJson(JSON.stringify([{ ...exam, date: '2026-02-31' }]))).toThrow('Invalid general exam.');
  });
});