import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { localize } from './localize';
import type { TranslationLanguage, LocalizedText } from '../lib/types';

const translatedLanguages: TranslationLanguage[] = ['en', 'fr', 'it', 'es'];

function readDataFile<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(process.cwd(), 'data', name), 'utf8')) as T;
}

describe('localize', () => {
  it('uses the requested language, then English, then German as a fallback', () => {
    const item: LocalizedText = {
      text: 'Deutsch',
      details: 'Deutsche Details',
      translations: {
        en: { text: 'English', details: 'English details' },
        fr: { text: 'Français' },
      },
    };

    expect(localize(item, 'fr')).toEqual({ text: 'Français', details: 'English details' });
    expect(localize(item, 'it')).toEqual({ text: 'English', details: 'English details' });
    expect(localize(item, 'de')).toEqual({ text: 'Deutsch', details: 'Deutsche Details' });
  });

  it('includes translations for all exam data in English, French, Italian and Spanish', () => {
    const techniques = readDataFile<Array<LocalizedText & { level: number }>>('techniques.json');
    const generalTasks = readDataFile<Array<LocalizedText & { id: string }>>('general-tasks.json');
    const tags = readDataFile<Array<LocalizedText & { id: string }>>('tags.json');

    for (const item of [...techniques, ...generalTasks, ...tags]) {
      for (const language of translatedLanguages) {
        expect(item.translations?.[language]?.text, `${item.text} / ${language} text`).toBeTruthy();
        if (item.details) {
          expect(item.translations?.[language]?.details, `${item.text} / ${language} details`).toBeTruthy();
        }
      }
    }
  });
});