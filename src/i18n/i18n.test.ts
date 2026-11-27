import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { localize } from './localize';
import type { TranslationLanguage, LocalizedText } from '../lib/types';
import { messages, type MessageKey } from './messages';

const translatedLanguages: TranslationLanguage[] = ['en', 'fr', 'it', 'es'];
const eventMessageKeys: MessageKey[] = [
  'events.involvedOnly', 'events.sortBy', 'events.categoryFilter', 'events.emptyTechniques', 'events.techniqueRange', 'events.selectedCount', 'events.applySelection',
  'events.cancelAttendance', 'events.confirmDeleteCandidate',
  'events.confirmDeleteExam', 'events.confirmDeleteEvent', 'events.confirmTitle', 'events.confirmAction', 'events.passVotes', 'events.openResultsFor', 'events.candidateCount', 'events.showCandidates', 'toast.resultsUnavailable', 'events.eventSaveRequired',
  'events.generateRandom', 'events.addTechniques', 'events.noExams', 'events.editEvent', 'events.openEvent', 'events.examLevel',
  'events.selectedTechniques', 'events.readOnly', 'events.isArchived', 'events.end', 'events.exams', 'events.viewExam', 'events.viewTechnique', 'events.noTechniqueDetails', 'profile.countryNoResults',
  'events.searchExaminer', 'events.noExaminerMatches', 'events.removeExaminer', 'events.examinerHasCandidates', 'events.cannotRemoveSelf',
];
const languageSpecificEventKeys: MessageKey[] = ['events.involvedOnly', 'events.cancelAttendance', 'events.confirmTitle', 'events.passVotes', 'events.openResultsFor', 'events.candidateCount', 'events.showCandidates', 'toast.resultsUnavailable', 'events.eventSaveRequired', 'events.examLevel', 'events.readOnly', 'events.isArchived', 'events.end', 'events.exams', 'events.viewExam', 'events.viewTechnique', 'events.noTechniqueDetails', 'profile.countryNoResults', 'events.searchExaminer', 'events.noExaminerMatches', 'events.removeExaminer', 'events.examinerHasCandidates', 'events.cannotRemoveSelf'];

function readDataFile<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(process.cwd(), 'data', name), 'utf8')) as T;
}

describe('localize', () => {
  it('uses the requested language, then English, then German as a fallback', () => {
    const item: LocalizedText = {
      title: 'Deutsch',
      text: 'Deutsch',
      details: 'Deutsche Details',
      translations: {
        en: { text: 'English', details: 'English details' },
        fr: { text: 'Français' },
      },
    };

    expect(localize(item, 'fr')).toMatchObject({ title: 'Français', text: 'Français', details: 'English details' });
    expect(localize(item, 'it')).toMatchObject({ title: 'English', text: 'English', details: 'English details' });
    expect(localize(item, 'de')).toMatchObject({ title: 'Deutsch', text: 'Deutsch', details: 'Deutsche Details' });
  });

  it('provides dedicated translations for new exam-event UI in every supported language', () => {
    for (const language of ['fr', 'it', 'es'] as const) {
      for (const key of eventMessageKeys) expect(messages[language][key], `${key} / ${language}`).toBeTruthy();
      for (const key of languageSpecificEventKeys) expect(messages[language][key], `${key} / ${language}`).not.toBe(messages.en[key]);
    }
  });

  it('translates previously English labels in German and French', () => {
    expect(messages.de['nav.lock']).toBe('Abmelden');
    expect(messages.de['preparation.lock']).toBe('Abmelden');
    expect(messages.de['tech.tabTags']).toBe('Schlagwörter');
    expect(messages.fr['tech.tabTags']).toBe('Étiquettes');
    expect(messages.fr['tech.tags']).toBe('Étiquettes');
  });

  it('includes translations for all exam data in English, French, Italian and Spanish', () => {
    const techniques = readDataFile<Array<LocalizedText & { id: string }>>('techniques.json');
    const tags = readDataFile<Array<LocalizedText & { id: string }>>('tags.json');

    for (const item of [...techniques, ...tags]) {
      expect(item.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      for (const language of translatedLanguages) {
        expect(item.translations?.[language]?.title, `${item.title} / ${language} title`).toBeTruthy();
        if (item.details) {
          expect(item.translations?.[language]?.details, `${item.title} / ${language} details`).toBeTruthy();
        }
        if (item.teaser) {
          expect(item.translations?.[language]?.teaser, `${item.title} / ${language} teaser`).toBeTruthy();
        }
      }
    }
  });
});