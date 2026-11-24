import { LEVELS, type ExamSession, type GeneralTask, type GeneralTaskPlacement, type Level, type PreparationSettings } from './types';
import { levelOf } from './random';

const SETTINGS_KEY = 'km-exam:preparation';
const ACTIVE_EXAM_KEYS = { random: 'km-exam:active-exam:random', general: 'km-exam:active-exam:general' } as const;

export function defaultPreparationSettings(generalTasks: readonly GeneralTask[]): PreparationSettings {
  return {
    firstName: '',
    lastName: '',
    level: 1,
    candidateCount: 1,
    techniqueCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    generalTaskPlacements: Object.fromEntries(generalTasks.map((task) => [task.id, 'hidden'])) as Record<string, GeneralTaskPlacement>,
  };
}

export function loadPreparationSettings(
  techniques: readonly { level?: Level; category?: `level-${Level}` | 'general' | 'other' }[],
  generalTasks: readonly GeneralTask[],
): PreparationSettings {
  const defaults = defaultPreparationSettings(generalTasks);
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaults;
    const stored = JSON.parse(raw) as Partial<PreparationSettings>;
    const counts = { ...defaults.techniqueCounts };
    for (const level of LEVELS) {
      const max = techniques.filter((technique) => levelOf(technique as { level?: Level; category?: `level-${Level}` | 'general' | 'other' }) === level).length;
      const proposed = stored.techniqueCounts?.[level];
      counts[level] = Number.isInteger(proposed) ? Math.min(max, Math.max(0, Number(proposed))) : 0;
    }
    const placements = { ...defaults.generalTaskPlacements };
    for (const task of generalTasks) {
      const placement = stored.generalTaskPlacements?.[task.id];
      if (placement === 'before' || placement === 'after' || placement === 'hidden') placements[task.id] = placement;
    }
    return {
      firstName: typeof stored.firstName === 'string' ? stored.firstName : '',
      lastName: typeof stored.lastName === 'string' ? stored.lastName : '',
      level: LEVELS.includes(stored.level as Level) ? (stored.level as Level) : 1,
      candidateCount: Number.isInteger(stored.candidateCount) && Number(stored.candidateCount) > 0 ? Number(stored.candidateCount) : 1,
      techniqueCounts: counts,
      generalTaskPlacements: placements,
    };
  } catch {
    return defaults;
  }
}

export function savePreparationSettings(settings: PreparationSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadActiveExam(kind: 'random' | 'general' = 'random'): ExamSession | null {
  try {
    const raw = localStorage.getItem(ACTIVE_EXAM_KEYS[kind]) ?? (kind === 'random' ? localStorage.getItem('km-exam:active-exam') : null);
    if (!raw) return null;
    const session = JSON.parse(raw) as ExamSession;
    if ((!session.firstName && !session.candidateName) || (!session.lastName && session.kind !== 'general' && kind !== 'general') || !LEVELS.includes(session.level) || !Array.isArray(session.tasks)) return null;
    return { ...session, kind: session.kind ?? kind };
  } catch {
    return null;
  }
}

export function saveActiveExam(session: ExamSession): void {
  localStorage.setItem(ACTIVE_EXAM_KEYS[session.kind === 'general' ? 'general' : 'random'], JSON.stringify(session));
}

export function clearActiveExam(kind?: 'random' | 'general'): void {
  if (!kind || kind === 'random') {
    localStorage.removeItem(ACTIVE_EXAM_KEYS.random);
    localStorage.removeItem('km-exam:active-exam');
  }
  if (!kind || kind === 'general') localStorage.removeItem(ACTIVE_EXAM_KEYS.general);
}