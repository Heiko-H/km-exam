import { LEVELS, type GeneralExam, type Level } from './types';

function isValidExamDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function parseGeneralExamsJson(content: string): GeneralExam[] {
  const parsed: unknown = JSON.parse(content);
  if (!Array.isArray(parsed)) throw new Error('Invalid general exam list.');
  const ids = new Set<string>();
  return parsed.map((item) => {
    if (!item || typeof item !== 'object') throw new Error('Invalid general exam.');
    const exam = item as Partial<GeneralExam>;
    const techniqueIds = exam.techniqueIds;
    if (
      typeof exam.id !== 'string' || !exam.id.trim() || ids.has(exam.id) ||
      typeof exam.name !== 'string' || !exam.name.trim() ||
      !LEVELS.includes(exam.level as Level) ||
      !Array.isArray(techniqueIds) || !techniqueIds.every((id) => typeof id === 'string' && id.trim()) ||
      new Set(techniqueIds).size !== techniqueIds.length ||
      (exam.date !== undefined && (typeof exam.date !== 'string' || !isValidExamDate(exam.date))) ||
      typeof exam.modification_date !== 'string' || Number.isNaN(Date.parse(exam.modification_date))
    ) throw new Error('Invalid general exam.');
    ids.add(exam.id);
    return exam as GeneralExam;
  });
}