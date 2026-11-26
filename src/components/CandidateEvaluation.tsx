import { useState } from 'react';
import type { CandidateTaskResult, ExamDefinition, ExamEvent, Examiner, Candidate, RatingCriterion, Technique } from '../lib/types';
import { emptyEvaluation } from '../lib/eventModel';
import { localize } from '../i18n/localize';
import { useI18n } from '../i18n/I18nProvider';
import { InfoButton } from './InfoButton';
import { averageRating } from '../lib/ratings';
import { Switch } from './Switch';

const criteria: { key: RatingCriterion; short: string; message: string }[] = [
  { key: 'technique', short: 'T', message: 'rating.technique' },
  { key: 'reflexes', short: 'R', message: 'rating.reflexes' },
  { key: 'conditioning', short: 'K', message: 'rating.conditioning' },
  { key: 'stability', short: 'S', message: 'rating.stability' },
];

interface CandidateEvaluationProps {
  event: ExamEvent;
  exam: ExamDefinition;
  candidate: Candidate;
  examiner: Examiner;
  techniques: Technique[];
  taskIds?: string[];
  showSummary?: boolean;
  onChange: (event: ExamEvent) => void;
}

export function CandidateEvaluation({ event, exam, candidate, examiner, techniques, taskIds = exam.techniqueIds, showSummary = false, onChange }: CandidateEvaluationProps) {
  const { t, language } = useI18n();
  const [activeRating, setActiveRating] = useState<{ taskId: string; criterion: RatingCriterion } | null>(null);
  const evaluation = event.results[exam.id]?.[candidate.id]?.[examiner.id] ?? emptyEvaluation();
  const localized = (id: string) => {
    const technique = techniques.find((item) => item.id === id);
    return technique ? localize(technique, language) : { title: t('events.missingTechnique'), text: t('events.missingTechnique') };
  };

  function saveEvaluation(next: typeof evaluation) {
    onChange({
      ...event,
      results: {
        ...event.results,
        [exam.id]: {
          ...event.results[exam.id],
          [candidate.id]: {
            ...event.results[exam.id]?.[candidate.id],
            [examiner.id]: next,
          },
        },
      },
      modification_date: new Date().toISOString(),
    });
  }

  function updateTask(taskId: string, patch: Partial<CandidateTaskResult>) {
    const old = evaluation.tasks[taskId] ?? { passed: false, repeated: false, note: '', ratings: {} };
    saveEvaluation({ ...evaluation, tasks: { ...evaluation.tasks, [taskId]: { ...old, ...patch, ratings: { ...old.ratings, ...patch.ratings } } } });
  }

  const overallPassed = evaluation.passed === true;
  return (
    <section className="space-y-3 rounded-xl border border-slate-700 bg-panel p-3 sm:p-4">
      <header className="flex flex-wrap items-center gap-2 border-b border-slate-700 pb-3">
        <h2 className="min-w-0 flex-1 truncate font-semibold text-white">{candidate.name}</h2>
        <div className="flex items-center gap-2"><Switch checked={overallPassed} label={overallPassed ? t('exam.passed') : t('exam.failed')} onChange={() => saveEvaluation({ ...evaluation, passed: !overallPassed })} /><span className={`text-sm font-semibold ${overallPassed ? 'text-emerald-300' : 'text-red-300'}`}>{overallPassed ? t('exam.passed') : t('exam.failed')}</span></div>
      </header>
      <div className="space-y-3">
        {taskIds.map((taskId, index) => {
          const item = techniques.find((technique) => technique.id === taskId);
          const text = localized(taskId);
          const task = evaluation.tasks[taskId] ?? { passed: false, repeated: false, note: '', ratings: {} };
          const ratingPopoverOpen = activeRating?.taskId === taskId;
          return <article className="rounded-lg border border-slate-700 bg-app/30 p-3" key={taskId}>
            <div className="flex flex-wrap items-start gap-2">
              <span className="text-sm font-bold text-primary/80">{index + 1}.</span>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold leading-snug text-white">{text.title}</h3>
                {text.teaser && <p className="mt-1 text-sm text-slate-300">{text.teaser}</p>}
                {item?.details && <div className="mt-1"><InfoButton details={text.details ?? item.details} title={text.title} /></div>}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Switch checked={task.passed} label={task.passed ? t('exam.passed') : t('exam.failed')} onChange={() => updateTask(taskId, { passed: !task.passed })} />
              <button aria-pressed={task.repeated} className={`h-9 min-w-10 rounded-md border text-lg ${task.repeated ? 'border-amber-500 bg-amber-950/60 text-amber-300' : 'border-slate-600 text-slate-400'}`} onClick={() => updateTask(taskId, { repeated: !task.repeated })} title={t('exam.repeated')} type="button">↻</button>
              {criteria.map((criterion) => <div className="relative" key={criterion.key}>
                <button aria-expanded={ratingPopoverOpen && activeRating?.criterion === criterion.key} className={`min-h-9 min-w-11 rounded-md border px-2 text-sm ${task.ratings[criterion.key] ? 'border-primary/60 bg-primary/10 text-primary' : 'border-slate-700 text-slate-500'}`} onClick={() => setActiveRating(ratingPopoverOpen && activeRating?.criterion === criterion.key ? null : { taskId, criterion: criterion.key })} title={t(criterion.message as never)} type="button">{criterion.short}{task.ratings[criterion.key] ? ` ${task.ratings[criterion.key]}` : ''}</button>
                {ratingPopoverOpen && activeRating?.criterion === criterion.key && <div className="absolute left-1/2 top-full z-30 mt-2 w-52 -translate-x-1/2 rounded-lg border border-slate-600 bg-panel p-3 shadow-2xl">
                  <p className="mb-2 text-center text-xs text-slate-300">{text.title} · {t(criterion.message as never)}</p>
                  <div className="grid grid-cols-3 gap-2">{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => <button className="aspect-square rounded-md border border-slate-600 text-sm text-white hover:border-primary hover:text-primary" key={score} onClick={() => { updateTask(taskId, { ratings: { [criterion.key]: score } }); setActiveRating(null); }} type="button">{score}</button>)}<button className="col-span-2 rounded-md border border-slate-600 px-2 py-2 text-sm text-slate-300 hover:border-primary" onClick={() => { updateTask(taskId, { ratings: { [criterion.key]: undefined } }); setActiveRating(null); }} type="button">{t('rating.none')}</button></div>
                </div>}
              </div>)}
            </div>
            <label className="mt-3 block text-xs text-slate-400">{t('exam.noteLabel')}<textarea className="mt-1 min-h-16 w-full resize-y rounded-md border border-slate-700 bg-field px-3 py-2 text-sm text-white" onChange={(e) => updateTask(taskId, { note: e.target.value })} placeholder={t('exam.notePlaceholder')} value={task.note} /></label>
          </article>;
        })}
      </div>
      {showSummary && <section className="rounded-lg border border-slate-700 p-3 print:border-slate-400">
        <h3 className="mb-2 text-sm font-semibold text-white print:text-black">{t('rating.average')}</h3>
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">{criteria.map((criterion) => {
          const average = averageRating(taskIds.map((id) => evaluation.tasks[id] ?? { ratings: {} }), criterion.key);
          return <div className="rounded-md border border-slate-700 px-3 py-2 print:border-slate-300" key={criterion.key}><dt className="text-xs text-slate-400 print:text-black">{t(criterion.message as never)}</dt><dd className="text-lg font-semibold text-primary print:text-black">{average === undefined ? '—' : average.toLocaleString(language, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</dd></div>;
        })}</dl>
      </section>}
      <label className="block text-sm text-slate-300">{t('exam.generalNote')}<textarea className="mt-1.5 min-h-20 w-full rounded-md border border-slate-700 bg-field px-3 py-2 text-sm text-white" onChange={(e) => saveEvaluation({ ...evaluation, generalNote: e.target.value })} placeholder={t('exam.generalNotePlaceholder')} value={evaluation.generalNote} /></label>
    </section>
  );
}