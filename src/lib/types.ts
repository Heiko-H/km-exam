export const LEVELS = [1, 2, 3, 4, 5] as const;

export type Level = (typeof LEVELS)[number];
export type GeneralTaskPlacement = 'hidden' | 'before' | 'after';
export type Language = 'de' | 'en' | 'fr' | 'it' | 'es';
export type TranslationLanguage = Exclude<Language, 'de'>;
export type Category = `level-${Level}` | 'general' | 'other';

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
  id: string;
  category: Category;
  tags: string[];
  modification_date: string;
  level?: Level;
}

export interface GeneralTask extends LocalizedText {
  id: string;
  category: 'general';
  tags: string[];
  modification_date: string;
}

export interface Tag extends LocalizedText {
  id: string;
  modification_date: string;
}

export interface GeneralExam {
  id: string;
  name: string;
  level: Level;
  techniqueIds: string[];
  date?: string;
  modification_date: string;
}

export type RatingCriterion = 'technique' | 'reflexes' | 'conditioning' | 'stability';
export type Ratings = Partial<Record<RatingCriterion, number>>;

export interface ExamData {
  techniques: Technique[];
  generalTasks: GeneralTask[];
  tags: Tag[];
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
  ratings?: Ratings;
}

export interface ExamSession {
  firstName: string;
  lastName: string;
  level: Level;
  candidateCount: number;
  date: string;
  tasks: ExamTask[];
  kind?: 'random' | 'general';
  examName?: string;
  examId?: string;
  candidateName?: string;
  generalNote?: string;
}