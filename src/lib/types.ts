export const LEVELS = [1, 2, 3, 4, 5] as const;

export type Level = (typeof LEVELS)[number];
export type GeneralTaskPlacement = 'hidden' | 'before' | 'after';
export type Language = 'de' | 'en' | 'fr' | 'it' | 'es';
export type TranslationLanguage = Exclude<Language, 'de'>;

export interface TranslatedContent {
  text: string;
  details?: string;
}

export type Translations = Partial<Record<TranslationLanguage, TranslatedContent>>;

export interface LocalizedText {
  text: string;
  details?: string;
  translations?: Translations;
}

export interface Technique extends LocalizedText {
  level: Level;
}

export interface GeneralTask extends LocalizedText {
  id: string;
}

export interface ExamData {
  techniques: Technique[];
  generalTasks: GeneralTask[];
}

export interface PreparationSettings {
  firstName: string;
  lastName: string;
  level: Level;
  candidateCount: number;
  techniqueCounts: Record<Level, number>;
  generalTaskPlacements: Record<string, GeneralTaskPlacement>;
}

export interface ExamTask extends LocalizedText {
  id: string;
  kind: 'technique' | 'general';
  level?: Level;
  passed: boolean;
  failed: boolean;
  repeated: boolean;
  note: string;
}

export interface ExamSession {
  firstName: string;
  lastName: string;
  level: Level;
  candidateCount: number;
  date: string;
  tasks: ExamTask[];
}