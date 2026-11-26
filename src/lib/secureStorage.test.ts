import { afterEach, describe, expect, it } from 'vitest';
import { loadSecureValue, saveSecureValue } from './secureStorage';

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
