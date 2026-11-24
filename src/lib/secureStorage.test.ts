import { afterEach, describe, expect, it } from 'vitest';
import { loadSecureValue, saveSecureValue } from './secureStorage';
import { parseGeneralExamsJson } from './generalExamImport';

const values = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  },
});

afterEach(() => values.clear());

describe('secure local storage', () => {
  it('stores encrypted values that can be restored with the session key', async () => {
    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    await saveSecureValue('exam', { name: 'Alpha 123' }, key);

    expect(values.get('exam')).not.toContain('Alpha 123');
    await expect(loadSecureValue('exam', key)).resolves.toEqual({ name: 'Alpha 123' });
  });

  it('returns null when the key does not match', async () => {
    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    const otherKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    await saveSecureValue('exam', { name: 'Beta 7' }, key);
    await expect(loadSecureValue('exam', otherKey)).resolves.toBeNull();
  });
});

describe('general exam import', () => {
  const valid = { id: 'a', name: 'Alpha 123', level: 3, techniqueIds: ['t1', 't2'], modification_date: '2026-11-24T10:00:00.000Z' };

  it('accepts a valid exam list', () => {
    expect(parseGeneralExamsJson(JSON.stringify([valid]))).toEqual([valid]);
  });

  it('rejects invalid levels, duplicate ids and non-lists', () => {
    expect(() => parseGeneralExamsJson(JSON.stringify([{ ...valid, level: 6 }]))).toThrow();
    expect(() => parseGeneralExamsJson(JSON.stringify([valid, valid]))).toThrow();
    expect(() => parseGeneralExamsJson(JSON.stringify(valid))).toThrow();
  });
});
