import { describe, expect, it } from 'vitest';
import { averageRating } from './ratings';
import type { ExamTask } from './types';

function examTask(ratings?: ExamTask['ratings']): ExamTask {
  return { id: crypto.randomUUID(), kind: 'technique', text: 'Technique', level: 1, passed: false, failed: false, repeated: false, note: '', ratings };
}

describe('exam rating averages', () => {
  it('averages only the values recorded for a criterion', () => {
    expect(averageRating([examTask({ stability: 2 }), examTask({ stability: 4 }), examTask()], 'stability')).toBe(3);
  });

  it('has no average until at least one valid rating exists', () => {
    expect(averageRating([examTask()], 'reflexes')).toBeUndefined();
  });
});