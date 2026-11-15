import { useState, type FormEvent } from 'react';
import { LEVELS, type ExamData, type GeneralTaskPlacement, type Level, type PreparationSettings } from '../lib/types';
import { Stepper } from './Stepper';
import { InfoButton } from './InfoButton';

interface PreparationProps {
  data: ExamData;
  settings: PreparationSettings;
  onChange: (settings: PreparationSettings) => void;
  onStart: () => Promise<void>;
  onLock: () => void;
}

const placementOptions: { value: GeneralTaskPlacement; label: string; shortLabel: string }[] = [
  { value: 'hidden', label: 'Nicht verwenden', shortLabel: 'Nicht verwenden' },
  { value: 'before', label: 'Vor Techniken anzeigen', shortLabel: 'Vor Techniken' },
  { value: 'after', label: 'Nach Techniken anzeigen', shortLabel: 'Nach Techniken' },
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
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">Konfiguration</h1>
        </div>
        <button className="rounded-md border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800" onClick={onLock} type="button">
          App sperren
        </button>
      </div>

      <p className="mb-6 rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-orange-100">
        Alle Prüfer müssen exakt die gleichen Daten eingeben. Eine Abweichung und die Prüfungsaufgaben stimmen nicht mehr überein.
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
            <div className="text-sm font-medium text-slate-200">
              Prüfungsstufe
              <div aria-label="Prüfungsstufe" className="mt-1 grid grid-cols-5 gap-2" role="group">
                {LEVELS.map((level) => (
                  <button
                    aria-label={`Stufe ${level}`}
                    aria-pressed={settings.level === level}
                    className={`min-h-11 whitespace-nowrap rounded-md border px-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary sm:px-2 sm:text-sm ${settings.level === level ? 'border-primary bg-primary text-white' : 'border-slate-600 bg-field text-slate-200 hover:bg-slate-800'}`}
                    key={level}
                    onClick={() => update('level', level as Level)}
                    type="button"
                  >
                    Stufe {level}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-sm font-medium text-slate-200 m-auto text-center">
              Gesamtanzahl Prüflinge
              <div className="mt-1">
                <Stepper
                  label="Gesamtanzahl Prüflinge"
                  max={Number.MAX_SAFE_INTEGER}
                  min={1}
                  onChange={(candidateCount) => update('candidateCount', candidateCount)}
                  value={settings.candidateCount}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-700 bg-panel p-4 sm:p-6">
          <h2 className="mb-1 text-lg font-semibold text-white">Zufällige Techniken</h2>
          <p className="mb-4 text-sm text-slate-400">Wähle für jede Stufe die Anzahl der abzufragenden Techniken.</p>
          <div className="space-y-3">
            {LEVELS.map((level) => {
              const max = data.techniques.filter((technique) => technique.level === level).length;
              return (
                <div className="flex flex-col gap-3 rounded-lg border border-slate-700 px-3 py-3 sm:flex-row sm:items-center sm:justify-between" key={level}>
                  <span className="font-medium text-slate-100">Stufe {level}<span className="ml-2 text-sm font-normal text-slate-400">({max} verfügbar)</span></span>
                  <Stepper
                    label={`Anzahl Techniken aus Stufe ${level}`}
                    max={max}
                    min={0}
                    onChange={(count) => update('techniqueCounts', { ...settings.techniqueCounts, [level]: count })}
                    value={settings.techniqueCounts[level]}
                  />
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border border-slate-700 bg-panel p-4 sm:p-6">
          <h2 className="mb-1 text-lg font-semibold text-white">Allgemeine Prüfungsaufgaben</h2>
          <p className="mb-4 text-sm text-slate-400">Diese Aufgaben werden zusätzlich zu den Techniken angezeigt.</p>
          <div className="space-y-3">
            {data.generalTasks.map((task) => (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-700 px-3 py-2" key={task.id}>
                <div className="flex min-w-0 items-center gap-1 font-medium text-slate-100">
                  <span>{task.text}</span>
                  {task.details && <InfoButton details={task.details} title={task.text} />}
                </div>
                <div
                  aria-label={`Anzeige von ${task.text}`}
                  className="flex flex-wrap gap-1"
                  role="radiogroup"
                >
                  {placementOptions.map((option, index) => {
                    const selectedPlacement = settings.generalTaskPlacements[task.id] ?? 'hidden';
                    const selectedIndex = placementOptions.findIndex((item) => item.value === selectedPlacement);
                    return (
                      <button
                        aria-checked={selectedPlacement === option.value}
                        aria-label={option.label}
                        className={`min-h-9 rounded-md border px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary ${selectedPlacement === option.value ? 'border-primary bg-primary/20 text-orange-100' : 'border-slate-600 bg-field text-slate-300 hover:bg-slate-800'}`}
                        key={option.value}
                        onClick={() => update('generalTaskPlacements', { ...settings.generalTaskPlacements, [task.id]: option.value })}
                        onKeyDown={(event) => {
                          let nextIndex: number | undefined;
                          if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % placementOptions.length;
                          if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index + placementOptions.length - 1) % placementOptions.length;
                          if (event.key === 'Home') nextIndex = 0;
                          if (event.key === 'End') nextIndex = placementOptions.length - 1;
                          if (nextIndex !== undefined) {
                            event.preventDefault();
                            const nextPlacement = placementOptions[nextIndex].value;
                            update('generalTaskPlacements', { ...settings.generalTaskPlacements, [task.id]: nextPlacement });
                            document.getElementById(`placement-${task.id}-${nextPlacement}`)?.focus();
                          }
                        }}
                        id={`placement-${task.id}-${option.value}`}
                        role="radio"
                        tabIndex={selectedIndex === index ? 0 : -1}
                        type="button"
                      >
                        {option.shortLabel}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {error && <p aria-live="polite" className="rounded-md border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-200">{error}</p>}
        <button className="mx-auto block w-full rounded-md bg-primary px-5 py-3 font-semibold text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 sm:w-auto" disabled={busy} type="submit">
          {busy ? 'Prüfung wird vorbereitet …' : 'Prüfung starten'}
        </button>
      </form>
    </main>
  );
}