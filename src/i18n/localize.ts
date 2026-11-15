import type { Language, LocalizedText } from '../lib/types';

export function localize(item: LocalizedText, language: Language): { text: string; details?: string } {
  if (language === 'de') return { text: item.text, details: item.details };
  const selected = item.translations?.[language];
  const english = item.translations?.en;
  return {
    text: selected?.text || english?.text || item.text,
    details: selected?.details || english?.details || item.details,
  };
}