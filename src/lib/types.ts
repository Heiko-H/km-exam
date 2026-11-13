export const LEVELS = [1, 2, 3, 4, 5] as const;

export type Level = (typeof LEVELS)[number];
export type GeneralTaskPlacement = 'hidden' | 'before' | 'after';

export interface Technique {
  level: Level;
  text: string;
  details?: string;
}

export interface GeneralTask {
  id: string;
  text: string;
  details?: string;
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

export interface ExamTask {
  id: string;
  kind: 'technique' | 'general';
  text: string;
  level?: Level;
  details?: string;
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