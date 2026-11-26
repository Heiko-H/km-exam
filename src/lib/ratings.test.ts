import { describe, expect, it } from 'vitest';
import { averageRating } from './ratings';
import type { CandidateTaskResult } from './types';

function taskResult(ratings: CandidateTaskResult['ratings'] = {}): CandidateTaskResult {
  return { passed: false, repeated: false, note: '', ratings };
}

describe('exam rating averages', () => {
  it('averages only the values recorded for a criterion', () => {
    expect(averageRating([taskResult({ stability: 2 }), taskResult({ stability: 4 }), taskResult()], 'stability')).toBe(3);
  });

  it('has no average until at least one valid rating exists', () => {
    expect(averageRating([taskResult()], 'reflexes')).toBeUndefined();
  });
});
