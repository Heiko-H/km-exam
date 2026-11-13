import { describe, expect, it } from 'vitest';
import { fibonacciDelay } from './lockout';

describe('Fibonacci login delay', () => {
  it('uses the sequence 1, 1, 2, 3, 5, 8 seconds', () => {
    expect([1, 2, 3, 4, 5, 6].map(fibonacciDelay)).toEqual([1, 1, 2, 3, 5, 8]);
  });

  it('returns zero before the first failed attempt', () => {
    expect(fibonacciDelay(0)).toBe(0);
  });
});