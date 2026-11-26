import { describe, expect, it } from 'vitest';
import { decryptWithKey, deriveEncryptionKey } from './crypto';
import { encryptAppData } from '../../build/encrypt-plugin';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe('encrypted exam data', () => {
  it('round-trips build-encrypted data with the entered password', async () => {
    const techniques = [
      { id: '11111111-1111-4111-8111-111111111111', category: 'level-1', title: 'Abwehr von Haken', teaser: 'Auf Distanz bleiben.', details: '<p>Auf Distanz bleiben.</p>', tags: [] },
      { id: '22222222-2222-4222-8222-222222222222', category: 'general', title: 'Sparring', tags: [] },
    ];
    const payload = encryptAppData('eine-sichere-testpassphrase', techniques, []);
    const key = await deriveEncryptionKey('eine-sichere-testpassphrase', payload);
    const data = await decryptWithKey(key, payload);

    expect(data.techniques).toHaveLength(2);
    expect(data.techniques[0]).toMatchObject({ id: techniques[0].id, title: 'Abwehr von Haken', teaser: 'Auf Distanz bleiben.', details: '<p>Auf Distanz bleiben.</p>', level: 1 });
    expect(data.techniques[1]).toMatchObject({ id: techniques[1].id, category: 'general', title: 'Sparring' });
    expect(data.generalTasks).toEqual([]);
    expect(data.examiners.map((examiner) => examiner.email)).toEqual(['peter@gmail.com', 'heiko@gmail.com', 'kai@gmail.com']);
    for (const examiner of data.examiners) expect(examiner.id).toMatch(uuidPattern);
  });

  it('rejects duplicate examiner initials', () => {
    const examiners = [
      { name: 'A', email: 'a@example.com', shortcode: 'AB' },
      { name: 'B', email: 'b@example.com', shortcode: 'ab' },
    ];
    expect(() => encryptAppData('eine-sichere-testpassphrase', [{ category: 'level-1', title: 'Technik' }], [], [], examiners)).toThrow('eindeutig');
  });

  it('rejects an incorrect password', async () => {
    const payload = encryptAppData('eine-sichere-testpassphrase', [{ level: 1, title: 'Technik' }], []);
    const key = await deriveEncryptionKey('falsches-passwort', payload);
    await expect(decryptWithKey(key, payload)).rejects.toThrow();
  });
});
