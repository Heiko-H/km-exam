import { describe, expect, it } from 'vitest';
import { decryptWithKey, deriveEncryptionKey } from './crypto';
import { encryptAppData } from '../../build/encrypt-plugin';

describe('encrypted exam data', () => {
  it('round-trips build-encrypted data with the entered password', async () => {
    const techniques = [{ level: 1, text: 'Abwehr von Haken', details: 'Auf Distanz bleiben.' }];
    const generalTasks = [{ id: 'sparring', text: 'Sparring' }];
    const payload = encryptAppData('eine-sichere-testpassphrase', techniques, generalTasks);
    const key = await deriveEncryptionKey('eine-sichere-testpassphrase', payload);
    await expect(decryptWithKey(key, payload)).resolves.toEqual({ techniques, generalTasks });
  });

  it('rejects an incorrect password', async () => {
    const payload = encryptAppData('eine-sichere-testpassphrase', [{ level: 1, text: 'Technik' }], []);
    const key = await deriveEncryptionKey('falsches-passwort', payload);
    await expect(decryptWithKey(key, payload)).rejects.toThrow();
  });
});