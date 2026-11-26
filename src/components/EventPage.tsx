import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { Candidate, ExamDefinition, ExamEvent, Examiner, Level, Technique } from '../lib/types';
import { candidatesForExam, passVotes } from '../lib/eventModel';
import { selectExamTechniques } from '../lib/random';
import { localize } from '../i18n/localize';
import { useI18n } from '../i18n/I18nProvider';
import { PageHeader } from './PageHeader';
import type { AppRoute } from './NavigationMenu';
import { IconButton } from './Icons';
import { Modal } from './Modal';
import { ConfirmModal } from './ConfirmModal';
import { TimePicker } from './TimePicker';
import { Stepper } from './Stepper';
import { TechniquePicker } from './TechniquePicker';

const newCounts = (): Record<Level, number> => ({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
const levels: Level[] = [1, 2, 3, 4, 5];

type ConfirmAction =
  | { kind: 'cancelCandidate'; candidateId: string }
  | { kind: 'deleteCandidate'; candidateId: string }
  | { kind: 'deleteExam'; examId: string }
  | { kind: 'deleteEvent' };

interface EventPageProps {
  event: ExamEvent;
  isNew: boolean;
  examiners: Examiner[];
  techniques: Technique[];
  activeExaminerId: string;
  onNavigate: (route: AppRoute) => void;
  onLock: () => void;
  onSave: (event: ExamEvent) => void;
  onChange: (event: ExamEvent) => void;
  onCancel: () => void;
  onDelete: (eventId: string) => void;
  onRun: (event: ExamEvent, examId: string) => void;
  onReview: (event: ExamEvent, examId: string, candidateId: string) => void;
}

export function EventPage({ event: initialEvent, isNew, examiners, techniques, activeExaminerId, onNavigate, onLock, onSave, onChange, onCancel, onDelete, onRun, onReview }: EventPageProps) {
  const { t, language } = useI18n();
  const [event, setEvent] = useState(initialEvent);
  const [eventBaseline, setEventBaseline] = useState(initialEvent);
  const [editMode, setEditMode] = useState<'none' | 'event' | 'candidate' | 'exam'>(isNew ? 'event' : 'none');
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidateLevels, setCandidateLevels] = useState<Level[]>([]);
  const [candidateExaminerId, setCandidateExaminerId] = useState(activeExaminerId);
  const [examId, setExamId] = useState<string | null>(null);
  const [examName, setExamName] = useState('');
  const [examLevel, setExamLevel] = useState<Level>(1);
  const [examKind, setExamKind] = useState<'general' | 'random'>('general');
  const [selectedTechniqueIds, setSelectedTechniqueIds] = useState<string[]>([]);
  const [randomCounts, setRandomCounts] = useState<Record<Level, number>>(newCounts);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState('');
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const canEdit = event.createdBy === activeExaminerId || event.examinerIds.includes(activeExaminerId);

  const sortedCandidates = useMemo(() => [...event.candidates].sort((a, b) => a.name.localeCompare(b.name, language)), [event.candidates, language]);
  const selectedExam = event.exams.find((item) => item.id === examId);
  const linkedExaminers = event.examinerIds.map((id) => examiners.find((item) => item.id === id)).filter((item): item is Examiner => Boolean(item));

  function setEventDraft(patch: Partial<ExamEvent>) {
    setEvent((current) => ({ ...current, ...patch, modification_date: new Date().toISOString() }));
  }

  function persistEvent(next: ExamEvent) {
    setEvent(next);
    setEventBaseline(next);
    onChange(next);
  }

  function beginEventEdit() {
    setEventBaseline(event);
    setEditMode('event');
  }

  function cancelEventEdit() {
    setEvent(eventBaseline);
    if (isNew) onCancel();
    else setEditMode('none');
  }

  function openCandidate(candidate?: Candidate) {
    if (editMode !== 'none') return;
    setCandidateId(candidate?.id ?? null);
    setCandidateName(candidate?.name ?? '');
    setCandidateEmail(candidate?.email ?? '');
    setCandidateLevels(candidate?.levels ?? []);
    setCandidateExaminerId(candidate?.examinerId ?? activeExaminerId);
    setEditMode('candidate');
  }

  function closeCandidate() {
    setEditMode('none');
    setCandidateId(null);
  }

  function saveCandidate() {
    if (!candidateName.trim() || candidateLevels.length === 0) return;
    const updated: Candidate = {
      id: candidateId ?? crypto.randomUUID(),
      name: candidateName.trim(),
      email: candidateEmail.trim(),
      levels: [...candidateLevels].sort((a, b) => a - b),
      examinerId: candidateExaminerId,
      cancelled: event.candidates.find((item) => item.id === candidateId)?.cancelled ?? false,
    };
    const next = { ...event, candidates: candidateId ? event.candidates.map((item) => item.id === candidateId ? updated : item) : [...event.candidates, updated], modification_date: new Date().toISOString() };
    persistEvent(next);
    closeCandidate();
  }

  function openExamEditor(exam?: ExamDefinition, kind: 'general' | 'random' = 'general') {
    if (editMode !== 'none') return;
    setExamId(exam?.id ?? null);
    setExamName(exam?.name ?? '');
    setExamLevel(exam?.level ?? 1);
    setExamKind(exam?.kind ?? kind);
    setSelectedTechniqueIds(exam?.techniqueIds ?? []);
    setRandomCounts(exam?.randomConfig ?? newCounts());
    setError('');
    setEditMode('exam');
  }

  function closeExamEditor() {
    setEditMode('none');
    setExamId(null);
    setPickerOpen(false);
    setError('');
  }

  async function generateRandomSelection() {
    if (!event.location.trim() || !event.date) {
      setError(t('events.locationDateRequired'));
      return;
    }
    const selected = await selectExamTechniques(techniques.filter((item) => item.category !== 'general'), randomCounts, {
      location: event.location,
      date: event.date,
      level: examLevel,
      sequence: selectedExam?.seedNumber ?? event.exams.length + 1,
    });
    const generatedIds = selected.map((item) => item.id);
    setSelectedTechniqueIds((current) => [...generatedIds, ...current.filter((id) => !generatedIds.includes(id))]);
    setError('');
  }

  function saveExam() {
    if (!examName.trim()) {
      setError(t('events.examNameRequired'));
      return;
    }
    const saved: ExamDefinition = {
      id: selectedExam?.id ?? crypto.randomUUID(),
      name: examName.trim(),
      level: examLevel,
      kind: examKind,
      techniqueIds: selectedTechniqueIds,
      seedNumber: selectedExam?.seedNumber ?? event.exams.length + 1,
      randomConfig: examKind === 'random' ? randomCounts : undefined,
      modification_date: new Date().toISOString(),
    };
    const next = { ...event, exams: selectedExam ? event.exams.map((item) => item.id === saved.id ? saved : item) : [...event.exams, saved], modification_date: new Date().toISOString() };
    persistEvent(next);
    closeExamEditor();
  }

  function saveEvent(eventForm: FormEvent<HTMLFormElement>) {
    eventForm.preventDefault();
    if (!event.location.trim() || !event.date || !isValidTime(event.startTime) || event.examinerIds.length === 0) return;
    const saved = { ...event, location: event.location.trim(), modification_date: new Date().toISOString() };
    setEvent(saved);
    setEventBaseline(saved);
    onSave(saved);
    setEditMode('none');
  }

  function confirmPendingAction() {
    if (!confirmAction) return;
    const action = confirmAction;
    setConfirmAction(null);
    if (action.kind === 'deleteEvent') {
      onDelete(event.id);
      return;
    }
    if (action.kind === 'deleteExam') {
      const results = Object.fromEntries(Object.entries(event.results).filter(([id]) => id !== action.examId)) as ExamEvent['results'];
      persistEvent({ ...event, exams: event.exams.filter((item) => item.id !== action.examId), results, modification_date: new Date().toISOString() });
      return;
    }
    if (action.kind === 'deleteCandidate') {
      const results = Object.fromEntries(Object.entries(event.results).map(([id, candidates]) => [id, Object.fromEntries(Object.entries(candidates).filter(([candidate]) => candidate !== action.candidateId))])) as ExamEvent['results'];
      persistEvent({ ...event, candidates: event.candidates.filter((item) => item.id !== action.candidateId), results, modification_date: new Date().toISOString() });
      return;
    }
    persistEvent({ ...event, candidates: event.candidates.map((item) => item.id === action.candidateId ? { ...item, cancelled: true } : item), modification_date: new Date().toISOString() });
  }

  function moveTechnique(index: number, target: number) {
    setSelectedTechniqueIds((current) => {
      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(Math.max(0, Math.min(next.length, target)), 0, moved);
      return next;
    });
  }

  const eventForm = editMode === 'event';
  const candidateForm = editMode === 'candidate';
  const examForm = editMode === 'exam';
  const editingDisabled = !canEdit || editMode !== 'none';

  return (
    <>
      <PageHeader activeRoute="exams" examinerShortcode={examiners.find((item) => item.id === activeExaminerId)?.shortcode} onLock={onLock} onNavigate={onNavigate} title={event.location || t('events.unnamed')} />
      <main className="mx-auto max-w-5xl space-y-5 px-3 py-5 sm:px-6 sm:py-8">
        <section className="rounded-xl border border-slate-700 bg-panel p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">{t('events.eventDetails')}</h2>
            <div className="flex gap-2">
              {!eventForm && <IconButton disabled={editingDisabled} icon="edit" label={t('events.editEvent')} onClick={beginEventEdit} />}
              {event.createdBy === activeExaminerId && <IconButton disabled={editMode !== 'none'} icon="delete" label={t('events.delete')} onClick={() => setConfirmAction({ kind: 'deleteEvent' })} className="border-red-900 text-red-300" />}
            </div>
          </div>
          {eventForm ? <form className="space-y-4" onSubmit={saveEvent}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm text-slate-300">{t('events.location')}<input className="mt-1.5 min-h-11 w-full rounded-md border border-slate-600 bg-field px-3 text-white" onChange={(e) => setEventDraft({ location: e.target.value })} required value={event.location} /></label>
              <label className="text-sm text-slate-300">{t('events.date')}<input className="mt-1.5 min-h-11 w-full rounded-md border border-slate-600 bg-field px-3 text-white" onChange={(e) => setEventDraft({ date: e.target.value })} required type="date" value={event.date} /></label>
            </div>
            <fieldset>
              <legend className="mb-2 text-sm text-slate-300">{t('events.startTime')}</legend>
              <TimePicker onChange={(startTime) => setEventDraft({ startTime })} value={event.startTime} />
            </fieldset>
            <label className="flex min-h-10 items-center gap-2 text-sm text-slate-200"><input checked={event.archived} className="accent-primary" onChange={(e) => setEventDraft({ archived: e.target.checked })} type="checkbox" />{t('events.isArchived')}</label>
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-slate-300">{t('events.examiners')}</legend>
              <div className="flex flex-wrap gap-2">{examiners.map((item) => {
                const selected = event.examinerIds.includes(item.id);
                const locked = item.id === activeExaminerId && selected;
                return <button aria-pressed={selected} className={`min-h-10 rounded-full border px-3 text-sm ${selected ? 'border-primary/70 bg-primary/10 text-white' : 'border-slate-600 text-slate-300'}`} disabled={locked} key={item.id} onClick={() => setEventDraft({ examinerIds: selected ? event.examinerIds.filter((id) => id !== item.id) : [...event.examinerIds, item.id] })} title={item.name} type="button">{item.shortcode}</button>;
              })}</div>
            </fieldset>
            <label className="block text-sm text-slate-300">{t('events.details')}<textarea className="mt-1.5 min-h-24 w-full rounded-md border border-slate-600 bg-field px-3 py-2 text-white" onChange={(e) => setEventDraft({ details: e.target.value })} value={event.details} /></label>
            {eventForm && <div className="flex justify-end gap-2"><IconButton icon="close" label={t('events.cancel')} onClick={cancelEventEdit} /><IconButton className="border-primary bg-primary text-white hover:bg-primary-hover" disabled={!event.location.trim() || !event.date || !isValidTime(event.startTime) || event.examinerIds.length === 0} icon="save" label={t('events.save')} type="submit" /></div>}
          </form> : <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <p><span className="block text-xs text-slate-400">{t('events.date')}</span><span className="font-medium text-white">{event.date || '—'}</span></p>
              <p><span className="block text-xs text-slate-400">{t('events.startTime')}</span><span className="font-medium text-white">{event.startTime || '—'}</span></p>
              <p><span className="block text-xs text-slate-400">{t('events.isArchived')}</span><span className="font-medium text-white">{event.archived ? '✓' : '—'}</span></p>
            </div>
            {event.details && <p className="whitespace-pre-wrap text-sm text-slate-300">{event.details}</p>}
            <div className="flex flex-wrap gap-2">{linkedExaminers.map((item) => <span className="rounded-full border border-slate-600 px-2.5 py-1 text-xs text-slate-300" key={item.id} title={item.name}>{item.shortcode}</span>)}</div>
          </div>}
          {!canEdit && <p className="mt-3 text-sm text-amber-300">{t('events.readOnly')}</p>}
        </section>

        <section className="rounded-xl border border-slate-700 bg-panel p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">{t('events.candidates')} <span className="text-sm font-normal text-slate-400">({event.candidates.length})</span></h2>
            <IconButton disabled={editingDisabled || isNew} icon="plus" label={t('events.addCandidate')} onClick={() => openCandidate()} />
          </div>
          {isNew && <p className="mb-3 rounded-lg border border-amber-800/70 bg-amber-950/20 p-3 text-sm text-amber-200">{t('events.eventSaveRequired')}</p>}
          <div className="divide-y divide-slate-700 rounded-lg border border-slate-700">
            {sortedCandidates.map((candidate) => <div className={`flex flex-wrap items-center gap-2 p-3 ${candidate.cancelled ? 'opacity-60' : ''}`} key={candidate.id}>
              <span className={`min-w-32 flex-1 font-medium text-white ${candidate.cancelled ? 'line-through' : ''}`}>{candidate.name}</span>
              <span className="text-xs text-slate-400">{candidate.email || '—'}</span>
              <span className="flex gap-1">{candidate.levels.map((item) => <span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary" key={item}>{item}</span>)}</span>
              <span className="rounded-full border border-slate-600 px-2 py-1 text-xs text-slate-300" title={examiners.find((item) => item.id === candidate.examinerId)?.name}>{examiners.find((item) => item.id === candidate.examinerId)?.shortcode ?? '—'}</span>
              <div className="flex items-center gap-1">
                <button className={`min-h-9 rounded-md border px-2.5 text-xs ${candidate.cancelled ? 'border-slate-600 text-slate-300' : 'border-amber-800 text-amber-200'}`} disabled={editingDisabled || isNew} onClick={() => candidate.cancelled ? persistEvent({ ...event, candidates: event.candidates.map((item) => item.id === candidate.id ? { ...item, cancelled: false } : item), modification_date: new Date().toISOString() }) : setConfirmAction({ kind: 'cancelCandidate', candidateId: candidate.id })} type="button">{candidate.cancelled ? t('events.uncancel') : t('events.cancelAttendance')}</button>
                <IconButton disabled={editingDisabled || isNew} icon="edit" label={t('events.editCandidate')} onClick={() => openCandidate(candidate)} />
                <IconButton className="border-red-900 text-red-300" disabled={editingDisabled || isNew} icon="delete" label={t('events.deleteCandidate')} onClick={() => setConfirmAction({ kind: 'deleteCandidate', candidateId: candidate.id })} />
              </div>
            </div>)}
            {sortedCandidates.length === 0 && <p className="p-4 text-sm text-slate-400">{t('events.noCandidates')}</p>}
          </div>
        </section>

        <section className="rounded-xl border border-slate-700 bg-panel p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">{t('events.exams')}</h2>
            <div className="flex gap-2">
              <button className="inline-flex min-h-10 items-center gap-2 rounded-md border border-primary px-3 text-sm text-primary disabled:opacity-40" disabled={editingDisabled || isNew} onClick={() => openExamEditor(undefined, 'general')} type="button"><span aria-hidden="true">＋</span>{t('events.newExam')}</button>
              <button className="inline-flex min-h-10 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-white disabled:opacity-40" disabled={editingDisabled || isNew} onClick={() => openExamEditor(undefined, 'random')} type="button"><span aria-hidden="true">＋</span>{t('events.newRandomExam')}</button>
            </div>
          </div>
          {event.exams.length === 0 ? <p className="rounded-lg border border-slate-700 p-4 text-sm text-slate-400">{t('events.noExams')}</p> : <div className="space-y-3">
            {event.exams.map((exam) => {
              const eligible = candidatesForExam(event, exam);
              return <article className="rounded-lg border border-slate-700 bg-app/30 p-3 sm:p-4" key={exam.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="min-w-0 flex-1"><h3 className="truncate font-semibold text-white">{exam.name}</h3><div className="mt-1 flex flex-wrap gap-1.5 text-xs"><span className="rounded-full border border-primary/40 px-2 py-0.5 text-primary">{t('events.levelOption', { level: exam.level })}</span><span className="rounded-full border border-slate-600 px-2 py-0.5 text-slate-300">{t(exam.kind === 'random' ? 'events.randomType' : 'events.generalType')}</span><span className="text-slate-400">{exam.techniqueIds.length} {t('events.techniqueCount')}</span></div></div>
                  <IconButton disabled={!canEdit || editMode !== 'none'} icon="play" label={t('events.run')} onClick={() => onRun(event, exam.id)} className="border-primary bg-primary text-white hover:bg-primary-hover" />
                  <IconButton disabled={editingDisabled || isNew} icon="edit" label={t('events.editExam')} onClick={() => openExamEditor(exam)} />
                  <IconButton className="border-red-900 text-red-300" disabled={editingDisabled || isNew} icon="delete" label={t('events.deleteExam')} onClick={() => setConfirmAction({ kind: 'deleteExam', examId: exam.id })} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {eligible.map((candidate) => {
                    const vote = event.results[exam.id]?.[candidate.id]?.[activeExaminerId]?.passed;
                    const counts = passVotes(event, exam.id, candidate.id);
                    const tone = vote === true ? 'border-emerald-700 bg-emerald-950/30 text-emerald-200' : vote === false ? 'border-red-800 bg-red-950/20 text-red-200' : 'border-slate-600 text-slate-200';
                    return <button className={`rounded-full border px-3 py-1.5 text-left text-xs disabled:cursor-not-allowed disabled:opacity-40 ${tone}`} disabled={!canEdit || editMode !== 'none'} key={candidate.id} onClick={() => onReview(event, exam.id, candidate.id)} type="button"><span className="block font-medium">{candidate.name}</span><span className="text-[0.7rem] opacity-80">{t('events.passVotes', counts)}</span></button>;
                  })}
                  {eligible.length === 0 && <span className="text-sm text-slate-500">{t('events.noCandidates')}</span>}
                </div>
              </article>;
            })}
          </div>}
        </section>
        <div className="flex justify-end"><button className="rounded-md border border-slate-600 px-4 py-2 text-sm text-slate-200" onClick={onCancel} type="button">{t('events.backToList')}</button></div>
      </main>

      {candidateForm && <Modal actions={<><IconButton icon="close" label={t('events.cancel')} onClick={closeCandidate} /><IconButton className="border-primary bg-primary text-white hover:bg-primary-hover" disabled={!candidateName.trim() || !candidateLevels.length} icon="save" label={t('events.saveCandidate')} onClick={saveCandidate} /></>} onClose={closeCandidate} size="large" title={candidateId ? t('events.editCandidate') : t('events.addCandidate')}>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-slate-300">{t('events.candidateName')}<input autoFocus className="mt-1.5 min-h-11 w-full rounded-md border border-slate-600 bg-field px-3 text-white" onChange={(e) => setCandidateName(e.target.value)} value={candidateName} /></label>
            <label className="text-sm text-slate-300">{t('events.candidateEmail')}<input className="mt-1.5 min-h-11 w-full rounded-md border border-slate-600 bg-field px-3 text-white" onChange={(e) => setCandidateEmail(e.target.value)} type="email" value={candidateEmail} /></label>
          </div>
          <fieldset><legend className="mb-2 text-sm text-slate-300">{t('events.candidateLevels')}</legend><div className="flex flex-wrap gap-2">{levels.map((item) => {
            const selected = candidateLevels.includes(item);
            return <button aria-pressed={selected} className={`min-h-10 rounded-md border px-4 ${selected ? 'border-primary bg-primary/15 text-primary' : 'border-slate-600 text-slate-300'}`} key={item} onClick={() => setCandidateLevels((previous) => selected ? previous.filter((level) => level !== item) : [...previous, item])} type="button">{item}</button>;
          })}</div></fieldset>
          <fieldset><legend className="mb-2 text-sm text-slate-300">{t('events.assignedExaminer')}</legend><div className="flex flex-wrap gap-2">{examiners.map((item) => <button aria-pressed={candidateExaminerId === item.id} className={`min-h-10 rounded-full border px-3 text-sm ${candidateExaminerId === item.id ? 'border-primary bg-primary/15 text-primary' : 'border-slate-600 text-slate-300'}`} key={item.id} onClick={() => setCandidateExaminerId(item.id)} title={item.name} type="button">{item.shortcode}</button>)}</div></fieldset>
        </div>
      </Modal>}

      {examForm && <Modal actions={<><IconButton icon="close" label={t('events.cancel')} onClick={closeExamEditor} /><IconButton className="border-primary bg-primary text-white hover:bg-primary-hover" icon="save" label={t('events.save')} onClick={saveExam} /></>} onClose={closeExamEditor} size="large" title={selectedExam ? t('events.editExam') : t(examKind === 'random' ? 'events.newRandomExam' : 'events.newExam')}>
        <div className="space-y-4">
          {error && <p className="rounded-md border border-red-800 bg-red-950/30 p-3 text-sm text-red-200">{error}</p>}
          <label className="block text-sm text-slate-300">{t('events.examName')}<input autoFocus className="mt-1.5 min-h-11 w-full rounded-md border border-slate-600 bg-field px-3 text-white" onChange={(e) => setExamName(e.target.value)} value={examName} /></label>
          <fieldset><legend className="mb-2 text-sm text-slate-300">{t('events.examLevel')}</legend><div className="flex flex-wrap gap-2">{levels.map((item) => <button aria-pressed={examLevel === item} className={`min-h-10 rounded-md border px-4 ${examLevel === item ? 'border-primary bg-primary/15 text-primary' : 'border-slate-600 text-slate-300'}`} key={item} onClick={() => setExamLevel(item)} type="button">{item}</button>)}</div></fieldset>
          <div className="rounded-lg border border-slate-700 p-3"><span className="text-xs font-medium text-slate-400">{t(examKind === 'random' ? 'events.randomType' : 'events.generalType')}</span>
            {examKind === 'random' && <div className="mt-3 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{levels.map((item) => <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-700 p-2" key={item}><span className="text-sm text-slate-300">{t('events.levelOption', { level: item })}</span><Stepper label={t('events.levelOption', { level: item })} max={techniques.filter((technique) => technique.category === `level-${item}`).length} onChange={(value) => setRandomCounts((current) => ({ ...current, [item]: value }))} value={Math.min(randomCounts[item], techniques.filter((technique) => technique.category === `level-${item}`).length)} /></div>)}</div>
              <button className="rounded-md border border-primary px-3 py-2 text-sm font-medium text-primary" onClick={() => void generateRandomSelection()} type="button">{t('events.generateRandom')}</button>
            </div>}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-medium text-white">{t('events.selectedTechniques')}</h3><button className="inline-flex min-h-9 items-center gap-2 rounded-md border border-slate-600 px-3 text-sm text-slate-200" onClick={() => setPickerOpen(true)} type="button"><span aria-hidden="true">＋</span>{t('events.addTechniques')}</button></div>
          {selectedTechniqueIds.length === 0 ? <p className="rounded-lg border border-slate-700 p-3 text-sm text-slate-400">{t('events.noTechniques')}</p> : <ol className="space-y-1.5">{selectedTechniqueIds.map((id, index) => {
            const technique = techniques.find((item) => item.id === id);
            const localized = technique ? localize(technique, language) : null;
            return <li className={`flex min-h-11 items-center gap-2 rounded-md border px-2 py-1.5 text-sm text-slate-200 ${dragIndex === index ? 'border-primary bg-primary/10' : 'border-slate-700'}`} draggable key={id} onDragEnd={() => setDragIndex(null)} onDragOver={(e) => e.preventDefault()} onDragStart={() => setDragIndex(index)} onDrop={() => { if (dragIndex !== null && dragIndex !== index) moveTechnique(dragIndex, index); setDragIndex(null); }}>
              <span aria-hidden="true" className="hidden cursor-grab text-slate-500 sm:inline" title={t('events.dragHandle')}>⠿</span><span className="w-6 text-right text-xs text-primary/80">{index + 1}.</span><span className="min-w-0 flex-1 truncate">{localized?.title ?? technique?.title ?? t('events.missingTechnique')}</span>
              <IconButton className="h-8 w-8" disabled={index === 0} icon="up" label={t('events.moveUp')} onClick={() => moveTechnique(index, index - 1)} />
              <IconButton className="h-8 w-8" disabled={index === selectedTechniqueIds.length - 1} icon="down" label={t('events.moveDown')} onClick={() => moveTechnique(index, index + 1)} />
              <IconButton className="h-8 w-8 border-red-900 text-red-300" icon="delete" label={t('events.removeTechnique')} onClick={() => setSelectedTechniqueIds((current) => current.filter((item) => item !== id))} />
            </li>;
          })}</ol>}
        </div>
      </Modal>}

      {pickerOpen && <TechniquePicker onApply={setSelectedTechniqueIds} onClose={() => setPickerOpen(false)} selectedIds={selectedTechniqueIds} techniques={techniques} />}

      {confirmAction && <ConfirmModal cancelLabel={t('events.cancel')} confirmLabel={t('events.confirmAction')} message={confirmMessage(confirmAction, t)} onCancel={() => setConfirmAction(null)} onConfirm={confirmPendingAction} title={t('events.confirmTitle')} />}
    </>
  );
}

function isValidTime(value: string): boolean {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return false;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour >= 8 && hour <= 20 && [0, 15, 30, 45].includes(minute);
}

function confirmMessage(action: ConfirmAction, t: ReturnType<typeof useI18n>['t']): string {
  switch (action.kind) {
    case 'cancelCandidate': return t('events.confirmCancelCandidate');
    case 'deleteCandidate': return t('events.confirmDeleteCandidate');
    case 'deleteExam': return t('events.confirmDeleteExam');
    case 'deleteEvent': return t('events.confirmDeleteEvent');
  }
}
