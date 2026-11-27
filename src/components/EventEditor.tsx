import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { Candidate, ExamDefinition, ExamEvent, Examiner, Level, Technique } from '../lib/types';
import { localDateString, selectExamTechniques } from '../lib/random';
import { candidateExaminerIds } from '../lib/eventModel';
import { PageHeader } from './PageHeader';
import type { AppRoute } from './NavigationMenu';
import { useI18n } from '../i18n/I18nProvider';

const newCounts = (): Record<Level, number> => ({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

interface EventEditorProps {
  event: ExamEvent;
  isNew: boolean;
  examiners: Examiner[];
  techniques: Technique[];
  activeExaminerId: string;
  onNavigate: (route: AppRoute) => void;
  onLock: () => void;
  onSave: (event: ExamEvent) => void;
  onCancel: () => void;
}

export function EventEditor({ event: initialEvent, isNew, examiners, techniques, activeExaminerId, onNavigate, onLock, onSave, onCancel }: EventEditorProps) {
  const { t, language } = useI18n();
  const [event, setEvent] = useState(initialEvent);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidateLevels, setCandidateLevels] = useState<Level[]>([]);
  const [candidateExaminer, setCandidateExaminer] = useState(activeExaminerId);
  const [examName, setExamName] = useState('');
  const [examLevel, setExamLevel] = useState<Level>(1);
  const [examKind, setExamKind] = useState<'general' | 'random'>('general');
  const [selectedTechniqueIds, setSelectedTechniqueIds] = useState<string[]>([]);
  const [randomCounts, setRandomCounts] = useState<Record<Level, number>>(newCounts);
  const [techniqueSearch, setTechniqueSearch] = useState('');
  const [error, setError] = useState('');
  const [editingCandidateId, setEditingCandidateId] = useState<string | null>(null);
  const [examEditorOpen, setExamEditorOpen] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const currentExam = event.exams.find((item) => item.id === editingExamId) ?? null;
  const candidates = useMemo(() => [...event.candidates].sort((a, b) => a.name.localeCompare(b.name, language)), [event.candidates, language]);
  const availableTechniques = useMemo(() => techniques.filter((item) => {
    if (item.category === 'general') return true;
    return item.category === `level-${examLevel}`;
  }).filter((item) => `${item.title} ${item.teaser ?? ''}`.toLocaleLowerCase(language).includes(techniqueSearch.trim().toLocaleLowerCase(language))), [examLevel, language, techniqueSearch, techniques]);

  function update(patch: Partial<ExamEvent>) {
    setEvent((current) => ({ ...current, ...patch, modification_date: new Date().toISOString() }));
  }

  function resetCandidate() {
    setCandidateName('');
    setCandidateEmail('');
    setCandidateLevels([]);
    setCandidateExaminer(activeExaminerId);
    setEditingCandidateId(null);
  }

  function beginEditCandidate(candidate: Candidate) {
    setEditingCandidateId(candidate.id);
    setCandidateName(candidate.name);
    setCandidateEmail(candidate.email);
    setCandidateLevels(candidate.levels);
    setCandidateExaminer(candidateExaminerIds(candidate)[0] ?? activeExaminerId);
  }

  function saveCandidate() {
    if (!candidateName.trim() || candidateLevels.length === 0) return;
    const updated: Candidate = {
      id: editingCandidateId ?? crypto.randomUUID(), name: candidateName.trim(), email: candidateEmail.trim(),
      levels: [...candidateLevels].sort((a, b) => a - b), examinerIds: [candidateExaminer], cancelled: event.candidates.find((item) => item.id === editingCandidateId)?.cancelled ?? false,
    };
    update({ candidates: editingCandidateId ? event.candidates.map((item) => item.id === editingCandidateId ? updated : item) : [...event.candidates, updated] });
    resetCandidate();
  }

  function openExamEditor(exam?: ExamDefinition, initialKind?: 'general' | 'random') {
    setEditingExamId(exam?.id ?? null);
    setExamEditorOpen(true);
    setExamName(exam?.name ?? '');
    setExamLevel(exam?.level ?? 1);
    setExamKind(exam?.kind ?? initialKind ?? 'general');
    setSelectedTechniqueIds(exam?.techniqueIds ?? []);
    setRandomCounts(exam?.randomConfig ?? newCounts());
    setTechniqueSearch('');
    setError('');
  }

  function closeExamEditor() {
    setEditingExamId(null);
    setExamEditorOpen(false);
    setError('');
  }

  async function saveExam() {
    if (!examName.trim()) {
      setError(t('events.examNameRequired'));
      return;
    }
    let taskIds = selectedTechniqueIds;
    if (!currentExam && examKind === 'random') {
      if (!event.location.trim() || !event.date) {
        setError(t('events.locationDateRequired'));
        return;
      }
      const selected = await selectExamTechniques(techniques.filter((item) => item.category !== 'general'), randomCounts, {
        location: event.location, date: event.date, level: examLevel, sequence: event.exams.length + 1,
      });
      taskIds = [...selected.map((item) => item.id), ...techniques.filter((item) => item.category === 'general' && selectedTechniqueIds.includes(item.id)).map((item) => item.id)];
    }
    const saved: ExamDefinition = {
      id: currentExam?.id ?? crypto.randomUUID(), name: examName.trim(), level: examLevel, kind: examKind,
      techniqueIds: taskIds, seedNumber: currentExam?.seedNumber ?? event.exams.length + 1,
      randomConfig: examKind === 'random' ? randomCounts : undefined, modification_date: new Date().toISOString(),
    };
    update({ exams: currentExam ? event.exams.map((item) => item.id === saved.id ? saved : item) : [...event.exams, saved] });
    closeExamEditor();
  }

  async function submit(eventForm: FormEvent<HTMLFormElement>) {
    eventForm.preventDefault();
    if (!event.location.trim() || !event.date || !event.startTime) return;
    onSave({ ...event, location: event.location.trim(), modification_date: new Date().toISOString() });
  }

  return (
    <>
      <PageHeader activeRoute="exams" examinerShortcode={examiners.find((item) => item.id === activeExaminerId)?.shortcode} onLock={onLock} onNavigate={onNavigate} title={isNew ? t('events.new') : t('events.edit')} />
      <main className="app-container py-5 sm:py-8">
        <form className="space-y-6" onSubmit={submit}>
          <section className="rounded-xl border border-slate-700 bg-panel p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">{t('events.eventDetails')}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="text-sm text-slate-300">{t('events.location')}<input className="mt-1.5 min-h-11 w-full rounded-md border border-slate-600 bg-field px-3 text-white" onChange={(e) => update({ location: e.target.value })} required value={event.location} /></label>
              <label className="text-sm text-slate-300">{t('events.date')}<input className="mt-1.5 min-h-11 w-full rounded-md border border-slate-600 bg-field px-3 text-white" onChange={(e) => update({ date: e.target.value })} required type="date" value={event.date} /></label>
              <label className="text-sm text-slate-300">{t('events.startTime')}<input className="mt-1.5 min-h-11 w-full rounded-md border border-slate-600 bg-field px-3 text-white" onChange={(e) => update({ startTime: e.target.value })} required type="time" value={event.startTime} /></label>
            </div>
            <label className="mt-4 flex min-h-10 items-center gap-2 text-sm text-slate-200"><input checked={event.archived} className="accent-primary" onChange={(e) => update({ archived: e.target.checked })} type="checkbox" />{t('events.archived')}</label>
            <fieldset className="mt-4">
              <legend className="mb-2 text-sm font-medium text-slate-300">{t('events.examiners')}</legend>
              <div className="flex flex-wrap gap-2">{examiners.map((item) => <label className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-sm ${event.examinerIds.includes(item.id) ? 'border-primary/70 bg-primary/10 text-white' : 'border-slate-600 text-slate-300'}`} key={item.id} title={item.name}><input checked={event.examinerIds.includes(item.id)} className="accent-primary" onChange={(e) => update({ examinerIds: e.target.checked ? [...event.examinerIds, item.id] : event.examinerIds.filter((id) => id !== item.id) })} type="checkbox" />{item.shortcode}</label>)}</div>
            </fieldset>
            <label className="mt-4 block text-sm text-slate-300">{t('events.details')}<textarea className="mt-1.5 min-h-28 w-full rounded-md border border-slate-600 bg-field px-3 py-2 text-white" onChange={(e) => update({ details: e.target.value })} value={event.details} /></label>
          </section>

          <section className="rounded-xl border border-slate-700 bg-panel p-4 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold text-white">{t('events.candidates')}</h2><button className="rounded-md border border-primary px-3 py-2 text-sm font-semibold text-primary" onClick={resetCandidate} type="button">{t('events.addCandidate')}</button></div>
            <div className="space-y-2">
              {candidates.map((candidate) => <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-700 p-3" key={candidate.id}>
                <span className="min-w-32 flex-1 font-medium text-white">{candidate.name}</span><span className="text-xs text-slate-400">{candidate.email || '—'}</span>
                <span className="flex flex-wrap gap-1">{candidate.levels.map((item) => <span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary" key={item}>{item}</span>)}</span>
                <span className="flex flex-wrap gap-1">{candidateExaminerIds(candidate).map((id) => { const examiner = examiners.find((item) => item.id === id); return examiner && <span className="rounded-full border border-slate-600 px-2 py-1 text-xs text-slate-300" key={id} title={examiner.name}>{examiner.shortcode}</span>; })}</span>
                <button className="rounded px-2 py-1 text-sm text-slate-300 hover:bg-slate-700" onClick={() => update({ candidates: event.candidates.map((item) => item.id === candidate.id ? { ...item, cancelled: !item.cancelled } : item) })} type="button">{candidate.cancelled ? t('events.uncancel') : t('events.cancelled')}</button>
                <button aria-label={t('events.editCandidate')} className="rounded px-2 py-1 text-primary hover:bg-slate-700" onClick={() => beginEditCandidate(candidate)} type="button">✎</button>
                <button aria-label={t('events.deleteCandidate')} className="rounded px-2 py-1 text-red-300 hover:bg-slate-700" onClick={() => update({ candidates: event.candidates.filter((item) => item.id !== candidate.id) })} type="button">×</button>
              </div>)}
            </div>
            <div className="mt-4 space-y-3 rounded-lg border border-slate-700 bg-app/30 p-3">
              <h3 className="font-medium text-white">{editingCandidateId ? t('events.editCandidate') : t('events.addCandidate')}</h3>
              <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm text-slate-300">{t('events.candidateName')}<input className="mt-1 w-full rounded-md border border-slate-600 bg-field px-3 py-2 text-white" onChange={(e) => setCandidateName(e.target.value)} value={candidateName} /></label>
                <label className="text-sm text-slate-300">{t('events.candidateEmail')}<input className="mt-1 w-full rounded-md border border-slate-600 bg-field px-3 py-2 text-white" onChange={(e) => setCandidateEmail(e.target.value)} type="email" value={candidateEmail} /></label></div>
              <fieldset><legend className="mb-2 text-sm text-slate-300">{t('events.candidateLevels')}</legend><div className="flex flex-wrap gap-2">{[1, 2, 3, 4, 5].map((item) => { const selected = candidateLevels.includes(item as Level); return <button aria-pressed={selected} className={`rounded-md border px-3 py-2 text-sm ${selected ? 'border-primary bg-primary/15 text-primary' : 'border-slate-600 text-slate-300'}`} key={item} onClick={() => setCandidateLevels((previous) => selected ? previous.filter((levelItem) => levelItem !== item) : [...previous, item as Level])} type="button">{item}</button>; })}</div></fieldset>
              <label className="block text-sm text-slate-300">{t('events.assignedExaminer')}<select className="mt-1 w-full rounded-md border border-slate-600 bg-field px-3 py-2 text-white" onChange={(e) => setCandidateExaminer(e.target.value)} value={candidateExaminer}>{examiners.map((item) => <option key={item.id} value={item.id}>{item.shortcode} · {item.name}</option>)}</select></label>
              <div className="flex gap-2"><button className="rounded-md bg-primary px-4 py-2 font-semibold text-white disabled:opacity-50" disabled={!candidateName.trim() || !candidateLevels.length} onClick={saveCandidate} type="button">{t('events.saveCandidate')}</button>{editingCandidateId && <button className="rounded-md border border-slate-600 px-4 py-2 text-slate-200" onClick={resetCandidate} type="button">{t('events.cancel')}</button>}</div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-700 bg-panel p-4 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold text-white">{t('events.exams')}</h2><div className="flex flex-wrap gap-2"><button className="rounded-md border border-primary px-3 py-2 text-sm text-primary" onClick={() => openExamEditor()} type="button">{t('events.newExam')}</button><button className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white" onClick={() => openExamEditor(undefined, 'random')} type="button">{t('events.newRandomExam')}</button></div></div>
            <div className="space-y-2">{event.exams.map((exam) => <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-700 p-3" key={exam.id}><span className="min-w-32 flex-1 text-white">{exam.name} · {t('events.levelOption', { level: exam.level })}</span><span className="text-xs text-slate-400">{exam.techniqueIds.length} {t('events.techniqueCount')}</span><button className="rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-200" onClick={() => openExamEditor(exam)} type="button">{t('events.edit')}</button><button aria-label={t('events.deleteExam')} className="rounded px-2 py-1 text-red-300" onClick={() => update({ exams: event.exams.filter((item) => item.id !== exam.id) })} type="button">×</button></div>)}</div>
            {examEditorOpen ? <div className="mt-4 space-y-4 rounded-lg border border-primary/40 bg-app/40 p-4">
              <h3 className="font-semibold text-white">{currentExam ? t('events.editExam') : t('events.newExam')}</h3>
              {error && <p className="text-sm text-red-300">{error}</p>}
              <div className="grid gap-3 sm:grid-cols-[1fr_12rem]"><label className="text-sm text-slate-300">{t('events.examName')}<input className="mt-1 w-full rounded-md border border-slate-600 bg-field px-3 py-2 text-white" onChange={(e) => setExamName(e.target.value)} value={examName} /></label><label className="text-sm text-slate-300">{t('events.level')}<select className="mt-1 w-full rounded-md border border-slate-600 bg-field px-3 py-2 text-white" onChange={(e) => setExamLevel(Number(e.target.value) as Level)} value={examLevel}>{[1, 2, 3, 4, 5].map((item) => <option key={item} value={item}>{t('events.levelOption', { level: item })}</option>)}</select></label></div>
              <div className="flex flex-wrap gap-2">{(['general', 'random'] as const).map((kind) => <button aria-pressed={examKind === kind} className={`rounded-md border px-3 py-2 text-sm ${examKind === kind ? 'border-primary bg-primary/10 text-primary' : 'border-slate-600 text-slate-300'}`} key={kind} onClick={() => setExamKind(kind)} type="button">{t(kind === 'general' ? 'events.generalType' : 'events.randomType')}</button>)}</div>
              {examKind === 'random' && !currentExam ? <><div className="grid grid-cols-2 gap-3 sm:grid-cols-5">{([1, 2, 3, 4, 5] as const).map((item) => <label className="text-sm text-slate-300" key={item}>{t('events.levelOption', { level: item })}<input className="mt-1 w-full rounded-md border border-slate-600 bg-field px-3 py-2 text-white" max={techniques.filter((tech) => tech.category === `level-${item}`).length} min={0} onChange={(e) => setRandomCounts((previous) => ({ ...previous, [item]: Number(e.target.value) }))} type="number" value={randomCounts[item]} /></label>)}</div><fieldset><legend className="mb-2 text-sm text-slate-300">{t('events.generalTasks')}</legend><div className="flex flex-wrap gap-2">{techniques.filter((item) => item.category === 'general').map((item) => <label className="inline-flex items-center gap-2 rounded-full border border-slate-600 px-3 py-2 text-sm text-slate-200" key={item.id}><input checked={selectedTechniqueIds.includes(item.id)} className="accent-primary" onChange={(e) => setSelectedTechniqueIds((previous) => e.target.checked ? [...previous, item.id] : previous.filter((id) => id !== item.id))} type="checkbox" />{item.title}</label>)}</div></fieldset></> : <>
                <label className="block text-sm text-slate-300">{t('events.techniqueSearch')}<input className="mt-1 w-full rounded-md border border-slate-600 bg-field px-3 py-2 text-white" onChange={(e) => setTechniqueSearch(e.target.value)} value={techniqueSearch} /></label>
                <div className="grid max-h-64 gap-1 overflow-y-auto rounded-lg border border-slate-700 p-2 sm:grid-cols-2">{availableTechniques.map((item) => <label className="flex cursor-pointer items-start gap-2 rounded p-2 text-sm text-slate-200 hover:bg-slate-800" key={item.id}><input checked={selectedTechniqueIds.includes(item.id)} className="mt-1 accent-primary" onChange={(e) => setSelectedTechniqueIds((previous) => e.target.checked ? [...previous, item.id] : previous.filter((id) => id !== item.id))} type="checkbox" /><span>{item.title}<small className="block text-slate-500">{item.category}</small></span></label>)}</div>
              </>}
              {(currentExam || examKind === 'general') && selectedTechniqueIds.length > 0 && <ol className="space-y-1 rounded-lg border border-slate-700 p-2">
                {selectedTechniqueIds.map((id, index) => {
                  const technique = techniques.find((item) => item.id === id);
                  const move = (target: number) => setSelectedTechniqueIds((previous) => {
                    const next = [...previous];
                    const [moved] = next.splice(index, 1);
                    next.splice(Math.max(0, Math.min(next.length, target)), 0, moved);
                    return next;
                  });
                  return <li className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm text-slate-200 ${dragIndex === index ? 'border-primary bg-primary/10' : 'border-slate-700'}`} draggable key={id} onDragEnd={() => setDragIndex(null)} onDragOver={(e) => e.preventDefault()} onDragStart={() => setDragIndex(index)} onDrop={() => { if (dragIndex !== null && dragIndex !== index) move(index); setDragIndex(null); }}>
                    <span aria-hidden="true" className="hidden cursor-grab text-slate-500 sm:inline" title={t('events.dragHandle')}>⠿</span>
                    <span className="w-6 text-right text-xs text-primary/80">{index + 1}.</span>
                    <span className="min-w-0 flex-1 truncate">{technique?.title ?? t('events.missingTechnique')}</span>
                    <button aria-label={t('events.moveUp')} className="h-8 w-8 rounded border border-slate-600 disabled:opacity-30" disabled={index === 0} onClick={() => move(index - 1)} type="button">↑</button>
                    <button aria-label={t('events.moveDown')} className="h-8 w-8 rounded border border-slate-600 disabled:opacity-30" disabled={index === selectedTechniqueIds.length - 1} onClick={() => move(index + 1)} type="button">↓</button>
                    <button aria-label={t('events.removeTechnique')} className="h-8 w-8 rounded text-red-300 hover:bg-slate-700" onClick={() => setSelectedTechniqueIds((previous) => previous.filter((item) => item !== id))} type="button">×</button>
                  </li>;
                })}
              </ol>}
              <div className="flex flex-wrap gap-2"><button className="rounded-md bg-primary px-4 py-2 font-semibold text-white" onClick={() => void saveExam()} type="button">{t('events.save')}</button><button className="rounded-md border border-slate-600 px-4 py-2 text-slate-200" onClick={closeExamEditor} type="button">{t('events.cancel')}</button></div>
            </div> : null}
          </section>

          <div className="flex flex-wrap justify-end gap-3"><button className="rounded-md border border-slate-600 px-4 py-2 text-slate-200" onClick={onCancel} type="button">{t('events.cancel')}</button><button className="rounded-md bg-primary px-5 py-2.5 font-semibold text-white disabled:opacity-50" disabled={!event.location.trim() || !event.date || !event.startTime} type="submit">{t('events.save')}</button></div>
        </form>
      </main>
    </>
  );
}

export function createEmptyEvent(examinerId: string): ExamEvent {
  return { id: crypto.randomUUID(), location: '', date: localDateString(), startTime: '09:00', archived: false, examinerIds: [examinerId], details: '', createdBy: examinerId, exams: [], candidates: [], results: {}, modification_date: new Date().toISOString() };
}