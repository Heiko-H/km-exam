import { describe, expect, it } from 'vitest';
import { createEmptyEvent } from './EventEditor';
import { localDateString } from '../lib/random';

describe('createEmptyEvent', () => {
  it('creates a new exam event for today owned by the examiner', () => {
    const event = createEmptyEvent('examiner-1');
    expect(event.date).toBe(localDateString());
    expect(event.createdBy).toBe('examiner-1');
    expect(event.examinerIds).toEqual(['examiner-1']);
    expect(event.exams).toEqual([]);
    expect(event.candidates).toEqual([]);
  });
});
