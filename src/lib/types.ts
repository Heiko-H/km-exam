export const LEVELS = [1, 2, 3, 4, 5] as const;

export type Level = (typeof LEVELS)[number];
export type GeneralTaskPlacement = 'hidden' | 'before' | 'after';
export type Language = 'de' | 'en' | 'fr' | 'it' | 'es';
export type TranslationLanguage = Exclude<Language, 'de'>;
export type Category = `level-${Level}` | 'general' | 'other';

export interface TranslatedContent {
  title?: string;
  teaser?: string;
  details?: string;
  text?: string;
}

export type Translations = Partial<Record<TranslationLanguage, TranslatedContent>>;

export interface LocalizedText {
  title?: string;
  teaser?: string;
  details?: string;
  /** Compatibility field for previously persisted local drafts. */
  text: string;
  translations?: Translations;
}

export interface Technique extends LocalizedText {
  title: string;
  id: string;
  category: Category;
  tags: string[];
  modification_date: string;
  level?: Level;
}

export type GeneralTask = Technique;

export interface Tag extends Pick<LocalizedText, 'translations' | 'text'> {
  title: string;
  id: string;
  modification_date: string;
}

export interface Examiner {
  id: string;
  name: string;
  email: string;
  shortcode: string;
  country: string;
  details: string;
  modification_date: string;
}

export interface GeneralExam {
  id: string;
  name: string;
  level: Level;
  techniqueIds: string[];
  kind?: 'general' | 'random';
  seedNumber?: number;
  randomConfig?: Record<Level, number>;
  date?: string;
  modification_date: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  levels: Level[];
  examinerIds: string[];
  examinerId?: string;
  cancelled: boolean;
}

export interface ExamDefinition extends GeneralExam {
  kind: 'general' | 'random';
  techniqueIds: string[];
}

export interface CandidateTaskResult {
  passed: boolean;
  repeated: boolean;
  note: string;
  ratings: Ratings;
}

export interface ExaminerEvaluation {
  tasks: Record<string, CandidateTaskResult>;
  generalNote: string;
  passed?: boolean;
}

export interface ExamEvent {
  id: string;
  location: string;
  date: string;
  startTime: string;
  archived: boolean;
  examinerIds: string[];
  details: string;
  createdBy: string;
  exams: ExamDefinition[];
  candidates: Candidate[];
  results: Record<string, Record<string, Record<string, ExaminerEvaluation>>>;
  modification_date: string;
}

export type RatingCriterion = 'technique' | 'reflexes' | 'conditioning' | 'stability';
export type Ratings = Partial<Record<RatingCriterion, number>>;

export interface ExamData {
  techniques: Technique[];
  tags: Tag[];
  examiners: Examiner[];
  /** Empty compatibility list; general tasks now live in techniques with category "general". */
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