import type { Candidate, ExamDefinition, ExamEvent, Examiner, ExaminerEvaluation, Level } from './types';

export function canEditEvent(event: ExamEvent, examinerId: string): boolean {
  return event.createdBy === examinerId || event.examinerIds.includes(examinerId);
}

export function isInvolved(event: ExamEvent, examinerId: string): boolean {
  return canEditEvent(event, examinerId);
}

export function passVotes(event: ExamEvent, examId: string, candidateId: string): { passed: number; total: number } {
  const examinerIds = [...new Set(event.examinerIds)];
  const total = Math.max(1, examinerIds.length);
  const passed = examinerIds.reduce((count, examinerId) => count + Number(event.results[examId]?.[candidateId]?.[examinerId]?.passed === true), 0);
  return { passed, total };
}

export function candidatesForExam(event: ExamEvent, exam: ExamDefinition): Candidate[] {
  return event.candidates.filter((candidate) => !candidate.cancelled && candidate.levels.includes(exam.level));
}

export function sortEvents(events: readonly ExamEvent[]): ExamEvent[] {
  return [...events].sort((a, b) => a.date.localeCompare(b.date) || a.location.localeCompare(b.location, undefined, { sensitivity: 'base' }));
}

export function emptyEvaluation(): ExaminerEvaluation {
  return { tasks: {}, generalNote: '' };
}

export function getExaminerShortcode(examiners: readonly Examiner[], examinerId: string): string {
  return examiners.find((examiner) => examiner.id === examinerId)?.shortcode ?? '—';
}

export function allCandidateLevels(levels: readonly Level[]): Level[] {
  return [...new Set(levels)].sort((a, b) => a - b);
}