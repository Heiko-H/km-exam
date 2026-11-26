import type { RatingCriterion, Ratings } from './types';

export const RATING_CRITERIA: readonly RatingCriterion[] = ['technique', 'reflexes', 'conditioning', 'stability'];

export function averageRating(tasks: readonly { ratings?: Ratings }[], criterion: RatingCriterion): number | undefined {
  const values = tasks
    .map((task) => task.ratings?.[criterion])
    .filter((value): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 10);
  if (values.length === 0) return undefined;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
