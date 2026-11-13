import { useState, type FormEvent } from 'react';
import { LEVELS, type ExamData, type GeneralTaskPlacement, type Level, type PreparationSettings } from '../lib/types';

interface PreparationProps {
  data: ExamData;
  settings: PreparationSettings;
  onChange: (settings: PreparationSettings) => void;
  onStart: () => Promise<void>;
  onLock: () => void;
}

const placementOptions: { value: GeneralTaskPlacement; label: string }[] = [
  { value: 'hidden', label: 'Nicht anzeigen' },
  { value: 'before', label: 'Vor Techniken anzeigen' },
  { value: 'after', label: 'Nach Techniken anzeigen' },
];

export function Preparation({ data, settings, onChange, onStart, onLock }: PreparationProps) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function update<K extends keyof PreparationSettings>(field: K, value: PreparationSettings[K]) {
    onChange({ ...settings, [field]: value });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!/\p{L}/u.test(settings.firstName.trim()) || !/\p{L}/u.test(settings.lastName.trim())) {
      setError('Vorname und Nachname müssen jeweils mindestens einen Buchstaben enthalten.');
      return;
    }
    if (!Number.isInteger(settings.candidateCount) || settings.candidateCount < 1) {
      setError('Die Gesamtanzahl der Prüflinge muss eine positive ganze Zahl sein.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await onStart();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Die Prüfung konnte nicht gestartet werden.');
    } finally {
      setBusy(false);
    }
  }

  const inputClass = 'mt-1 w-full rounded-md border border-slate-600 bg-field px-3 py-2.5 text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/30';

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">KM Prüfung</p>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">Prüfungsvorbereitung</h1>
        </div>
        <button className="rounded-md border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800" onClick={onLock} type="button">
          App sperren
        </button>
      </div>

      <p className="mb-6 rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-orange-100">
        Alle Prüfer müssen exakt die gleichen Daten eingeben. Eine Abweichung und die Prüfungsaufgaben weichen voneinander ab.
      </p>

      <form className="space-y-6" onSubmit={submit}>
        <section className="rounded-xl border border-slate-700 bg-panel p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Prüfling</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-200">
              Vorname
              <input className={inputClass} onChange={(event) => update('firstName', event.target.value)} required value={settings.firstName} />
            </label>
            <label className="text-sm font-medium text-slate-200">
              Nachname
              <input className={inputClass} onChange={(event) => update('lastName', event.target.value)} required value={settings.lastName} />
            </label>
            <label className="text-sm font-medium text-slate-200">
              Prüfungsstufe
              <select className={inputClass} onChange={(event) => update('level', Number(event.target.value) as Level)} value={settings.level}>
                {LEVELS.map((level) => <option key={level} value={level}>Stufe {level}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-200">
              Gesamtanzahl Prüflinge
              <input
                className={inputClass}
                min={1}
                onChange={(event) => update('candidateCount', Number(event.target.value))}
                required
                step={1}
                type="number"
                value={settings.candidateCount}
              />
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-slate-700 bg-panel p-4 sm:p-6">
          <h2 className="mb-1 text-lg font-semibold text-white">Zufällige Techniken</h2>
          <p className="mb-4 text-sm text-slate-400">Wähle für jede Stufe die Anzahl der abzufragenden Techniken.</p>
          <div className="space-y-3">
            {LEVELS.map((level) => {
              const max = data.techniques.filter((technique) => technique.level === level).length;
              return (
                <label className="flex items-center justify-between gap-4 rounded-lg border border-slate-700 px-3 py-3" key={level}>
                  <span className="font-medium text-slate-100">Stufe {level}<span className="ml-2 text-sm font-normal text-slate-400">({max} verfügbar)</span></span>
                  <input
                    aria-label={`Anzahl Techniken aus Stufe ${level}`}
                    className="w-24 rounded-md border border-slate-600 bg-field px-3 py-2 text-right text-white outline-none focus:border-primary"
                    max={max}
                    min={0}
                    onChange={(event) => update('techniqueCounts', { ...settings.techniqueCounts, [level]: Number(event.target.value) })}
                    step={1}
                    type="number"
                    value={settings.techniqueCounts[level]}
                  />
                </label>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border border-slate-700 bg-panel p-4 sm:p-6">
          <h2 className="mb-1 text-lg font-semibold text-white">Allgemeine Prüfungsaufgaben</h2>
          <p className="mb-4 text-sm text-slate-400">Diese Aufgaben werden zusätzlich zu den Techniken angezeigt.</p>
          <div className="space-y-3">
            {data.generalTasks.map((task) => (
              <label className="flex flex-col gap-2 rounded-lg border border-slate-700 px-3 py-3 sm:flex-row sm:items-center sm:justify-between" key={task.id}>
                <span className="font-medium text-slate-100">{task.text}</span>
                <select
                  aria-label={`Anzeige von ${task.text}`}
                  className="rounded-md border border-slate-600 bg-field px-3 py-2 text-white outline-none focus:border-primary"
                  onChange={(event) => update('generalTaskPlacements', {
                    ...settings.generalTaskPlacements,
                    [task.id]: event.target.value as GeneralTaskPlacement,
                  })}
                  value={settings.generalTaskPlacements[task.id] ?? 'hidden'}
                >
                  {placementOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
            ))}
          </div>
        </section>

        {error && <p aria-live="polite" className="rounded-md border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-200">{error}</p>}
        <button className="w-full rounded-md bg-primary px-5 py-3 font-semibold text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 sm:w-auto" disabled={busy} type="submit">
          {busy ? 'Prüfung wird vorbereitet …' : 'Prüfung starten'}
        </button>
      </form>
    </main>
  );
}