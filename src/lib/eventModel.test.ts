import { describe, expect, it } from 'vitest';
import { canEditEvent, candidatesForExam, isInvolved, passVotes, sortEvents } from './eventModel';
import type { ExamDefinition, ExamEvent } from './types';

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
        { id: 'marc', name: 'Marc', email: '', levels: [3], examinerId: 'e1', cancelled: false },
        { id: 'lisa', name: 'Lisa', email: '', levels: [3, 4], examinerId: 'e1', cancelled: false },
        { id: 'tom', name: 'Tom', email: '', levels: [3], examinerId: 'e1', cancelled: true },
        { id: 'eva', name: 'Eva', email: '', levels: [2], examinerId: 'e1', cancelled: false },
      ],
    });
    expect(candidatesForExam(item, exam).map((candidate) => candidate.id)).toEqual(['marc', 'lisa']);
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
