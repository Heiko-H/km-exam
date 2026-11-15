import { useEffect, useState, type FormEvent } from 'react';
import { recordFailedLogin, remainingLockoutSeconds } from '../lib/lockout';
import { LanguageSelect } from './LanguageSelect';
import { useI18n } from '../i18n/I18nProvider';

interface LoginProps {
  onUnlock: (password: string) => Promise<void>;
}

export function Login({ onUnlock }: LoginProps) {
  const { t } = useI18n();
  const [password, setPassword] = useState('');
  const [remaining, setRemaining] = useState(() => remainingLockoutSeconds());
  const [passwordIncorrect, setPasswordIncorrect] = useState(false);
  const [failedDelay, setFailedDelay] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(remainingLockoutSeconds()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || remaining > 0) return;
    setBusy(true);
    setPasswordIncorrect(false);
    try {
      await onUnlock(password);
    } catch {
      const delay = recordFailedLogin();
      setRemaining(delay);
      setFailedDelay(delay);
      setPasswordIncorrect(true);
      setPassword('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-10">
      <div className="fixed right-4 top-4 z-20">
        <LanguageSelect />
      </div>
      <section className="w-full rounded-xl border border-slate-700 bg-panel p-6 shadow-xl sm:p-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">{t('login.brand')}</p>
        <h1 className="mb-2 text-2xl font-bold text-white">{t('login.title')}</h1>
        <p className="mb-6 text-slate-300">{t('login.description')}</p>
        <form className="space-y-4" onSubmit={submit}>
          <label className="block text-sm font-medium text-slate-200" htmlFor="app-password">
            {t('login.password')}
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
          {passwordIncorrect && (
            <p aria-live="polite" className="text-sm text-red-300">
              {t('login.wrongPassword', {
                count: failedDelay,
                unit: t(failedDelay === 1 ? 'login.second' : 'login.seconds'),
              })}
            </p>
          )}
          {remaining > 0 && (
            <p aria-live="polite" className="text-sm text-amber-300">
              {t('login.wait', {
                count: remaining,
                unit: t(remaining === 1 ? 'login.second' : 'login.seconds'),
              })}
            </p>
          )}
          <button
            className="w-full rounded-md bg-primary px-4 py-3 font-semibold text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
            disabled={busy || remaining > 0 || !password}
            type="submit"
          >
            {busy ? t('login.checking') : t('login.signIn')}
          </button>
        </form>
      </section>
    </main>
  );
}