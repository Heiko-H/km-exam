import type { Language, LocalizedText } from '../lib/types';

export function localize(item: LocalizedText, language: Language): { title: string; text: string; teaser?: string; details?: string } {
  if (language === 'de') {
    const title = item.title || item.text;
    return { title, text: title, teaser: item.teaser, details: item.details };
  }
  const selected = item.translations?.[language];
  const english = item.translations?.en;
  const title = selected?.title || selected?.text || english?.title || english?.text || item.title || item.text;
  return {
    title,
    text: title,
    teaser: selected?.teaser || english?.teaser || item.teaser,
    details: selected?.details || english?.details || item.details,
  };
}