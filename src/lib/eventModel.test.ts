import { describe, expect, it } from 'vitest';
import { canEditEvent, candidateExaminerIds, candidateOutcome, candidatesForExam, isInvolved, passVotes, sortEvents } from './eventModel';
import type { Candidate, ExamDefinition, ExamEvent } from './types';

function event(patch: Partial<ExamEvent> = {}): ExamEvent {
  return {
    id: crypto.randomUUID(), location: 'Dojo', date: '2026-12-01', startTime: '09:00', archived: false,
    examinerIds: ['e2'], details: '', createdBy: 'e1', exams: [], candidates: [], results: {}, modification_date: '2026-11-26', ...patch,
  };
}

const exam: ExamDefinition = { id: 'x', name: 'Alpha', level: 3, kind: 'general', techniqueIds: [], modification_date: '2026-11-26' };

describe('exam event model', () => {
  it('allows the creator and linked examiners to edit', () => {
    const item = event();
    expect(canEditEvent(item, 'e1')).toBe(true);
    expect(canEditEvent(item, 'e2')).toBe(true);
    expect(canEditEvent(item, 'e3')).toBe(false);
  });

  it('identifies events where the examiner is involved', () => {
    expect(isInvolved(event(), 'e1')).toBe(true);
    expect(isInvolved(event(), 'e2')).toBe(true);
    expect(isInvolved(event(), 'e3')).toBe(false);
  });

  it('counts passed votes against all assigned examiners', () => {
    const item = event({
      examinerIds: ['e1', 'e2', 'e3'],
      results: { x: { marc: { e1: { tasks: {}, generalNote: '', passed: true }, e2: { tasks: {}, generalNote: '', passed: true } } } },
    });
    expect(passVotes(item, 'x', 'marc')).toEqual({ passed: 2, total: 3 });
  });

  it('uses a non-zero denominator for legacy events without assigned examiners', () => {
    expect(passVotes(event({ examinerIds: [] }), 'x', 'marc')).toEqual({ passed: 0, total: 1 });
  });

  it('offers only non-cancelled candidates registered for the exam level', () => {
    const item = event({
      candidates: [
        { id: 'marc', name: 'Marc', email: '', levels: [3], examinerIds: ['e1'], cancelled: false },
        { id: 'lisa', name: 'Lisa', email: '', levels: [3, 4], examinerIds: ['e1'], cancelled: false },
        { id: 'tom', name: 'Tom', email: '', levels: [3], examinerIds: ['e1'], cancelled: true },
        { id: 'eva', name: 'Eva', email: '', levels: [2], examinerIds: ['e1'], cancelled: false },
      ],
    });
    expect(candidatesForExam(item, exam).map((candidate) => candidate.id)).toEqual(['marc', 'lisa']);
  });

  it('normalizes assigned examiners and supports legacy candidate data', () => {
    expect(candidateExaminerIds({ examinerIds: ['e1', 'e2', 'e1'], examinerId: 'e3' })).toEqual(['e1', 'e2']);
    expect(candidateExaminerIds({ examinerIds: undefined, examinerId: 'e3' })).toEqual(['e3']);
    expect(candidateExaminerIds({ examinerIds: [], examinerId: 'e3' })).toEqual(['e3']);
  });

  it('shows the majority outcome across eligible exam votes', () => {
    const candidate: Candidate = { id: 'marc', name: 'Marc', email: '', levels: [3], examinerIds: ['e1', 'e2', 'e3'], cancelled: false };
    const item = event({
      exams: [exam, { ...exam, id: 'second-level-3' }, { ...exam, id: 'level-2', level: 2 }],
      results: {
        x: { marc: {
          e1: { tasks: {}, generalNote: '', passed: true },
          e2: { tasks: {}, generalNote: '', passed: false },
          e3: { tasks: {}, generalNote: '', passed: false },
          unrelated: { tasks: {}, generalNote: '', passed: false },
        } },
        'second-level-3': { marc: {
          e1: { tasks: {}, generalNote: '', passed: true },
          e2: { tasks: {}, generalNote: '', passed: true },
        } },
        'level-2': { marc: { e1: { tasks: {}, generalNote: '', passed: false } } },
      },
    });
    expect(candidateOutcome(item, candidate)).toBe('passed');
  });

  it('treats a tie as failed and leaves candidates without a vote undecided', () => {
    const candidate: Candidate = { id: 'marc', name: 'Marc', email: '', levels: [3], examinerIds: ['e1', 'e2'], cancelled: false };
    const item = event({
      exams: [exam],
      results: { x: { marc: {
        e1: { tasks: {}, generalNote: '', passed: true },
        e2: { tasks: {}, generalNote: '', passed: false },
      } } },
    });
    expect(candidateOutcome(item, candidate)).toBe('failed');
    expect(candidateOutcome(event({ exams: [exam] }), candidate)).toBeUndefined();
  });

  it('sorts by date ascending and then by location', () => {
    const sorted = sortEvents([
      event({ id: 'c', date: '2026-12-02', location: 'A' }),
      event({ id: 'b', date: '2026-12-01', location: 'Stuttgart' }),
      event({ id: 'a', date: '2026-12-01', location: 'Berlin' }),
    ]);
    expect(sorted.map((item) => item.id)).toEqual(['a', 'b', 'c']);
  });
});
