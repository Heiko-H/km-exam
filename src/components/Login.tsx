import { useEffect, useState, type FormEvent } from 'react';
import { recordFailedLogin, remainingLockoutSeconds } from '../lib/lockout';

interface LoginProps {
  onUnlock: (password: string) => Promise<void>;
}

export function Login({ onUnlock }: LoginProps) {
  const [password, setPassword] = useState('');
  const [remaining, setRemaining] = useState(() => remainingLockoutSeconds());
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(remainingLockoutSeconds()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || remaining > 0) return;
    setBusy(true);
    setError('');
    try {
      await onUnlock(password);
    } catch {
      const delay = recordFailedLogin();
      setRemaining(delay);
      setError(`Passwort falsch. Bitte ${delay} ${delay === 1 ? 'Sekunde' : 'Sekunden'} warten.`);
      setPassword('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-10">
      <section className="w-full rounded-xl border border-slate-700 bg-panel p-6 shadow-xl sm:p-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">Krav-Maga</p>
        <h1 className="mb-2 text-2xl font-bold text-white">Prüfungs-App</h1>
        <p className="mb-6 text-slate-300">Gib das Passwort ein, um die App zu verwenden.</p>
        <form className="space-y-4" onSubmit={submit}>
          <label className="block text-sm font-medium text-slate-200" htmlFor="app-password">
            Passwort
            <input
              autoComplete="current-password"
              className="mt-2 w-full rounded-md border border-slate-600 bg-field px-3 py-3 text-base text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              disabled={busy || remaining > 0}
              id="app-password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          {error && <p aria-live="polite" className="text-sm text-red-300">{error}</p>}
          {remaining > 0 && (
            <p aria-live="polite" className="text-sm text-amber-300">
              Neue Eingabe in {remaining} {remaining === 1 ? 'Sekunde' : 'Sekunden'} möglich.
            </p>
          )}
          <button
            className="w-full rounded-md bg-primary px-4 py-3 font-semibold text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
            disabled={busy || remaining > 0 || !password}
            type="submit"
          >
            {busy ? 'Prüfe Passwort …' : 'Anmelden'}
          </button>
        </form>
      </section>
    </main>
  );
}