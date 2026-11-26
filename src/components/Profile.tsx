import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Examiner } from '../lib/types';
import { PageHeader } from './PageHeader';
import type { AppRoute } from './NavigationMenu';
import { useI18n } from '../i18n/I18nProvider';

interface ProfileProps {
  examiner: Examiner;
  examiners: Examiner[];
  onNavigate: (route: AppRoute) => void;
  onLock: () => void;
  onSave: (examiner: Examiner) => void;
}

const countries = ['DE', 'AT', 'CH', 'GB', 'US', 'FR', 'IT', 'ES'];

export function Profile({ examiner, examiners, onNavigate, onLock, onSave }: ProfileProps) {
  const { t } = useI18n();
  const [name, setName] = useState(examiner.name);
  const [email, setEmail] = useState(examiner.email);
  const [shortcode, setShortcode] = useState(examiner.shortcode);
  const [country, setCountry] = useState(examiner.country);
  const [details, setDetails] = useState(examiner.details);
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [error, setError] = useState('');

  function submit(eventForm: FormEvent<HTMLFormElement>) {
    eventForm.preventDefault();
    if (!name.trim() || !email.trim() || !shortcode.trim()) return;
    if (password !== repeatPassword) {
      setError(t('profile.passwordMismatch'));
      return;
    }
    if (examiners.some((item) => item.id !== examiner.id && item.shortcode.toLocaleLowerCase() === shortcode.trim().toLocaleLowerCase())) {
      setError(t('profile.shortcodeTaken'));
      return;
    }
    if (examiners.some((item) => item.id !== examiner.id && item.email.toLocaleLowerCase() === email.trim().toLocaleLowerCase())) {
      setError(t('profile.emailTaken'));
      return;
    }
    setError('');
    onSave({ ...examiner, name: name.trim(), email: email.trim(), shortcode: shortcode.trim().toUpperCase(), country, details, modification_date: new Date().toISOString() });
    setPassword('');
    setRepeatPassword('');
  }

  return (
    <>
      <PageHeader activeRoute="profile" examinerShortcode={examiner.shortcode} onLock={onLock} onNavigate={onNavigate} title={t('profile.title')} />
      <main className="mx-auto max-w-3xl px-3 py-5 sm:px-6 sm:py-8">
        <form className="space-y-4 rounded-xl border border-slate-700 bg-panel p-4 sm:p-6" onSubmit={submit}>
          {error && <p aria-live="polite" className="rounded-md border border-red-800 bg-red-950/30 p-3 text-sm text-red-200">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-slate-300">{t('profile.name')}<input className="mt-1.5 min-h-11 w-full rounded-md border border-slate-600 bg-field px-3 text-white" onChange={(e) => setName(e.target.value)} required value={name} /></label>
            <label className="text-sm text-slate-300">{t('profile.email')}<input className="mt-1.5 min-h-11 w-full rounded-md border border-slate-600 bg-field px-3 text-white" onChange={(e) => setEmail(e.target.value)} required type="email" value={email} /></label>
            <label className="text-sm text-slate-300">{t('profile.shortcode')}<input className="mt-1.5 min-h-11 w-full rounded-md border border-slate-600 bg-field px-3 uppercase text-white" maxLength={6} onChange={(e) => setShortcode(e.target.value)} required value={shortcode} /></label>
            <label className="text-sm text-slate-300">{t('profile.country')}<select className="mt-1.5 min-h-11 w-full rounded-md border border-slate-600 bg-field px-3 text-white" onChange={(e) => setCountry(e.target.value)} value={country}>{countries.map((item) => <option key={item} value={item}>{new Intl.DisplayNames(undefined, { type: 'region' }).of(item) ?? item}</option>)}</select></label>
            <label className="text-sm text-slate-300">{t('profile.password')}<input autoComplete="new-password" className="mt-1.5 min-h-11 w-full rounded-md border border-slate-600 bg-field px-3 text-white" onChange={(e) => setPassword(e.target.value)} type="password" value={password} /></label>
            <label className="text-sm text-slate-300">{t('profile.repeatPassword')}<input autoComplete="new-password" className="mt-1.5 min-h-11 w-full rounded-md border border-slate-600 bg-field px-3 text-white" onChange={(e) => setRepeatPassword(e.target.value)} type="password" value={repeatPassword} /></label>
          </div>
          <p className="text-xs text-slate-500">{t('profile.passwordNotice')}</p>
          <label className="block text-sm text-slate-300">{t('profile.details')}<textarea className="mt-1.5 min-h-32 w-full rounded-md border border-slate-600 bg-field px-3 py-2 text-white" onChange={(e) => setDetails(e.target.value)} value={details} /></label>
          <div className="flex justify-end"><button className="rounded-md bg-primary px-5 py-2.5 font-semibold text-white" type="submit">{t('events.save')}</button></div>
        </form>
      </main>
    </>
  );
}