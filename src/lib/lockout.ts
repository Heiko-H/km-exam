const STORAGE_KEY = 'km-exam:login-lockout';

export interface LockoutState {
  failures: number;
  blockedUntil: number;
}

export function fibonacciDelay(failureCount: number): number {
  if (failureCount <= 0) return 0;
  let previous = 1;
  let current = 1;
  for (let index = 2; index < failureCount; index += 1) {
    [previous, current] = [current, previous + current];
  }
  return current;
}

export function readLockoutState(): LockoutState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { failures: 0, blockedUntil: 0 };
    const parsed = JSON.parse(stored) as Partial<LockoutState>;
    return {
      failures: Number.isInteger(parsed.failures) && Number(parsed.failures) > 0 ? Number(parsed.failures) : 0,
      blockedUntil: Number.isFinite(parsed.blockedUntil) ? Number(parsed.blockedUntil) : 0,
    };
  } catch {
    return { failures: 0, blockedUntil: 0 };
  }
}

export function remainingLockoutSeconds(now = Date.now()): number {
  return Math.max(0, Math.ceil((readLockoutState().blockedUntil - now) / 1000));
}

export function recordFailedLogin(now = Date.now()): number {
  const state = readLockoutState();
  const failures = state.failures + 1;
  const seconds = fibonacciDelay(failures);
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ failures, blockedUntil: now + seconds * 1000 }));
  return seconds;
}

export function clearFailedLogins(): void {
  localStorage.removeItem(STORAGE_KEY);
}