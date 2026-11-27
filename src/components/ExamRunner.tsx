import { useMemo, useState } from 'react';
import type { ExamEvent, Examiner, ExamDefinition, Technique } from '../lib/types';
import { candidatesForExam } from '../lib/eventModel';
import { localize } from '../i18n/localize';
import { useI18n } from '../i18n/I18nProvider';
import { CandidateEvaluation } from './CandidateEvaluation';
import { InfoButton } from './InfoButton';
import { formatDate } from '../lib/date';

interface ExamRunnerProps {
  event: ExamEvent;
  exam: ExamDefinition;
  examiner: Examiner;
  techniques: Technique[];
  onChange: (event: ExamEvent) => void;
  onEnd: () => void;
}

export function ExamRunner({ event, exam, examiner, techniques, onChange, onEnd }: ExamRunnerProps) {
  const { t, language } = useI18n();
  const eligible = useMemo(() => candidatesForExam(event, exam), [event, exam]);
  const [selectedIds, setSelectedIds] = useState<string[]>(() => eligible.map((candidate) => candidate.id));
  const [taskIndex, setTaskIndex] = useState(0);
  const tasks = exam.techniqueIds;
  const currentTaskId = tasks[taskIndex];
  const item = techniques.find((technique) => technique.id === currentTaskId);
  const text = item ? localize(item, language) : { title: t('events.missingTechnique'), teaser: '', details: '' };
  const examNumber = Math.max(1, event.exams.findIndex((eventExam) => eventExam.id === exam.id) + 1);
  const selectedCandidates = eligible.filter((candidate) => selectedIds.includes(candidate.id));
  const visibleCandidates = selectedCandidates;

  function changeTask(delta: number) {
    setTaskIndex((current) => Math.max(0, Math.min(tasks.length - 1, current + delta)));
  }

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-20 border-b border-slate-700 bg-app/95 shadow-md backdrop-blur print:hidden">
        <div className="app-container py-3">
          <div className="flex items-center gap-3">
            <button className="rounded-md border border-slate-600 px-3 py-2 text-sm text-slate-200" onClick={onEnd} type="button">{t('events.end')}</button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-primary">{event.location} · {formatDate(event.date, language)} · {event.startTime}</p>
              <h1 className="truncate font-bold text-white">{examNumber}. {exam.name} · {t('events.levelOption', { level: exam.level })}</h1>
            </div>
            <span className="shrink-0 rounded-full border border-slate-600 px-2.5 py-1 text-xs text-slate-300">{examiner.shortcode}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold leading-snug text-white sm:text-lg">{text.title}</h2>
              {text.teaser && <p className="mt-1 line-clamp-2 text-sm text-slate-300">{text.teaser}</p>}
            </div>
            {text.details && <InfoButton details={text.details} title={text.title} />}
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <span className="rounded-full border border-primary/50 px-3 py-1.5 text-sm font-semibold tabular-nums text-primary">{tasks.length ? taskIndex + 1 : 0}/{tasks.length}</span>
              <button className="min-h-10 rounded-md border border-slate-600 px-3 text-sm text-slate-200" onClick={() => setTaskIndex(0)} type="button">{t('events.backToStart')}</button>
            </div>
          </div>
        </div>
      </header>

      <main className="app-container space-y-4 py-4 sm:py-6">
        <section className="rounded-xl border border-slate-700 bg-panel p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold text-white">{t('events.candidates')}</h2>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{eligible.map((candidate) => {
            const selected = selectedIds.includes(candidate.id);
            return <button aria-pressed={selected} className={`shrink-0 rounded-full border px-3 py-2 text-sm ${selected ? 'border-primary bg-primary/15 text-primary' : 'border-slate-700 text-slate-500'}`} key={candidate.id} onClick={() => setSelectedIds((previous) => selected ? previous.filter((id) => id !== candidate.id) : [...previous, candidate.id])} title={candidate.email} type="button">{candidate.name}</button>;
          })}</div>
        </section>

        {tasks.length === 0 && <p className="rounded-lg border border-amber-700 bg-amber-950/30 p-4 text-amber-200">{t('events.noTechniques')}</p>}
        {visibleCandidates.length === 0 && <p className="rounded-lg border border-slate-700 bg-panel p-4 text-slate-400">{eligible.length ? t('events.noSelectedCandidates') : t('events.noCandidates')}</p>}
        {currentTaskId && visibleCandidates.length > 0 && <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleCandidates.map((candidate) => <CandidateEvaluation compact event={event} exam={exam} examiner={examiner} key={candidate.id} onChange={onChange} candidate={candidate} techniques={techniques} taskIds={[currentTaskId]} />)}
        </div>}
      </main>

      <button aria-label={t('events.previousTechnique')} className="fixed left-0 top-1/2 z-10 flex min-h-14 items-center rounded-r-xl border border-l-0 border-slate-600 bg-panel/95 px-2 text-2xl text-white shadow-xl disabled:opacity-30 sm:px-4" disabled={taskIndex <= 0} onClick={() => changeTask(-1)} type="button">‹</button>
      <button aria-label={t('events.nextTechnique')} className="fixed right-0 top-1/2 z-10 flex min-h-14 items-center rounded-l-xl border border-r-0 border-slate-600 bg-panel/95 px-2 text-2xl text-white shadow-xl disabled:opacity-30 sm:px-4" disabled={taskIndex >= tasks.length - 1} onClick={() => changeTask(1)} type="button">›</button>
    </div>
  );
}