import { Fragment, useEffect, useRef, useState } from 'react';
import type { ExamSession, ExamTask } from '../lib/types';
import { Modal } from './Modal';
import { InfoButton } from './InfoButton';
import { useI18n } from '../i18n/I18nProvider';
import { localize } from '../i18n/localize';
import { Icon, IconButton } from './Icons';
import { averageRating, RATING_CRITERIA } from '../lib/ratings';
import type { RatingCriterion, Ratings } from '../lib/types';
import type { MessageKey } from '../i18n/messages';
import { formatDate } from '../lib/date';

interface ExamProps {
  session: ExamSession;
  onTaskChange: (taskId: string, changes: Partial<Pick<ExamTask, 'passed' | 'failed' | 'repeated' | 'note' | 'ratings'>>) => void;
  onGeneralNoteChange: (note: string) => void;
  onNewExam: () => void;
  onEndExam: () => void;
}

function percentage(value: number, total: number): number {
  return total === 0 ? 0 : Math.round((value / total) * 100);
}

const ratingLabels: Record<RatingCriterion, { key: MessageKey; letter: string }> = {
  technique: { key: 'rating.technique', letter: 'T' },
  reflexes: { key: 'rating.reflexes', letter: 'R' },
  conditioning: { key: 'rating.conditioning', letter: 'K' },
  stability: { key: 'rating.stability', letter: 'S' },
};

interface TaskCardProps {
  task: ExamTask;
  number: number;
  onChange: ExamProps['onTaskChange'];
}

function TaskCard({ task, number, onChange }: TaskCardProps) {
  const { language, t } = useI18n();
  const localizedTask = localize(task, language);
  const hasNote = task.note.length > 0;
  const [noteOpen, setNoteOpen] = useState(hasNote);
  const [ratingCriterion, setRatingCriterion] = useState<RatingCriterion | null>(null);

  return (
    <article className="exam-task rounded-xl border border-slate-700 bg-panel p-3 sm:p-5 print:p-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between print:flex-row print:items-center print:gap-2">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2 print:mb-0">
            <span className="text-sm font-medium tabular-nums text-primary/80 print:text-xs">{number}.</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 print:text-[10px]">
              {task.kind === 'technique' ? t('exam.techniqueLevel', { level: task.level ?? '' }) : t('exam.generalTask')}
            </span>
            {task.repeated && <span className="rounded-full bg-amber-950 px-2 py-0.5 text-xs font-medium text-amber-200 print:hidden">{t('exam.repeated')}</span>}
          </div>
          <h3 className="flex flex-wrap items-center gap-2 text-lg font-semibold text-white print:text-sm">
            <span>{localizedTask.text}</span>
            {localizedTask.details && <InfoButton details={localizedTask.details} title={localizedTask.text} />}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:ml-4 print:flex print:flex-1 print:items-center print:justify-end">
          <button
            aria-pressed={task.passed}
            aria-label={t(task.passed ? 'exam.passed' : 'exam.failed')}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary print:hidden ${task.passed ? 'border-emerald-500 bg-emerald-900 text-emerald-100' : 'border-red-500 bg-red-950/60 text-red-200 hover:bg-red-900'}`}
            onClick={() => onChange(task.id, { passed: !task.passed, failed: task.passed })}
            type="button"
          >
            <Icon name={task.passed ? 'check' : 'close'} />
          </button>
          <button
            aria-pressed={task.repeated}
            aria-label={t('exam.repeated')}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-primary print:hidden ${task.repeated ? 'border-amber-500 bg-amber-900 text-amber-100' : 'border-slate-600 text-slate-300 hover:bg-slate-800'}`}
            onClick={() => onChange(task.id, { repeated: !task.repeated })}
            type="button"
          >
            <Icon name="repeat" />
          </button>
          <div className="relative flex gap-1 print:hidden">
            {RATING_CRITERIA.map((criterion) => {
              const label = ratingLabels[criterion];
              const value = task.ratings?.[criterion];
              return (
                <button aria-label={`${t(label.key)}${value === undefined ? '' : ` ${value}`}`} className={`min-w-10 rounded-md border px-2 py-1.5 text-sm font-semibold ${value === undefined ? 'border-slate-600 text-slate-400 hover:bg-slate-800' : 'border-primary/50 bg-primary/10 text-primary'}`} key={criterion} onClick={() => setRatingCriterion(criterion)} type="button">
                  {label.letter}{value === undefined ? '' : ` ${value}`}
                </button>
              );
            })}
            {ratingCriterion && (
              <RatingPopover
                criterion={ratingCriterion}
                onClose={() => setRatingCriterion(null)}
                onSelect={(value) => {
                  const ratings: Ratings = { ...task.ratings };
                  if (value === null) delete ratings[ratingCriterion];
                  else ratings[ratingCriterion] = value;
                  onChange(task.id, { ratings });
                  setRatingCriterion(null);
                }}
                selected={task.ratings?.[ratingCriterion]}
                taskTitle={localizedTask.text}
              />
            )}
          </div>
          <span className="hidden whitespace-nowrap text-sm font-semibold print:inline">
            {task.passed ? (
              <>
                <span className="print-status-passed">{t('exam.passed')}</span>
                {task.repeated && <>{' '}{t('exam.repeatedSuffix')}</>}
              </>
            ) : (
              <>
                <span className="print-status-failed">{t('exam.failed')}</span>
                {task.repeated && <>{' '}{t('exam.repeatedSuffix')}</>}
              </>
            )}
          </span>
          <span className="ml-auto hidden gap-2 text-xs print:flex">
            {RATING_CRITERIA.map((criterion) => {
              const value = task.ratings?.[criterion];
              return value === undefined ? null : <span className="font-semibold text-black" key={criterion}>{ratingLabels[criterion].letter} <span className="text-primary">{value}</span></span>;
            })}
          </span>
        </div>
      </div>
      <details
        className={`mt-3 border-t border-slate-700 pt-3 print:mt-1 print:border-0 print:pt-0 ${hasNote ? '' : 'print:hidden'}`}
        onToggle={(event) => setNoteOpen(event.currentTarget.open)}
        open={noteOpen || hasNote}
      >
        <summary
          aria-disabled={hasNote || undefined}
          className={`w-fit text-sm font-medium text-slate-300 ${hasNote ? 'cursor-default' : 'cursor-pointer'}`}
          onClick={(event) => {
            if (hasNote) event.preventDefault();
          }}
          title={hasNote ? t('exam.noteLockedHint') : undefined}
        >
          {t('exam.noteHeading')}
        </summary>
        <label className="mt-3 block text-sm text-slate-300">
          {t('exam.noteLabel')}
          <textarea
            className="mt-1 min-h-20 w-full resize-y rounded-md border border-slate-600 bg-field px-3 py-2 text-white outline-none focus:border-primary print:hidden"
            onChange={(event) => onChange(task.id, { note: event.target.value })}
            placeholder={t('exam.notePlaceholder')}
            value={task.note}
          />
          <span className="hidden whitespace-pre-wrap print:block">{task.note}</span>
        </label>
      </details>
    </article>
  );
}

function RatingPopover({ criterion, selected, taskTitle, onClose, onSelect }: {
  criterion: RatingCriterion;
  selected?: number;
  taskTitle: string;
  onClose: () => void;
  onSelect: (value: number | null) => void;
}) {
  const { t } = useI18n();
  const popoverRef = useRef<HTMLDivElement>(null);
  const label = t(ratingLabels[criterion].key);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!popoverRef.current?.contains(event.target as Node)) onClose();
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div aria-label={t('rating.choose', { criterion: label })} className="absolute right-0 top-full z-30 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-slate-600 bg-panel p-3 shadow-2xl" ref={popoverRef} role="dialog">
      <p className="mb-1 truncate text-sm font-semibold text-white">{taskTitle}</p>
      <p className="mb-3 text-xs text-slate-400">{t('rating.choose', { criterion: label })}</p>
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
          <button aria-pressed={selected === value} className={`h-10 rounded-md border text-lg font-bold tabular-nums ${selected === value ? 'border-primary bg-primary text-white' : 'border-slate-600 bg-field text-slate-200 hover:bg-slate-700'}`} key={value} onClick={() => onSelect(value)} type="button">{value}</button>
        ))}
        <button aria-pressed={selected === undefined} className="col-span-2 h-10 rounded-md border border-slate-600 bg-field font-medium text-slate-200 hover:bg-slate-700" onClick={() => onSelect(null)} type="button">{t('rating.none')}</button>
      </div>
    </div>
  );
}

export function Exam({ session, onTaskChange, onGeneralNoteChange, onNewExam, onEndExam }: ExamProps) {
  const { language, t } = useI18n();
  const [confirmNewExam, setConfirmNewExam] = useState(false);
  const [confirmEndExam, setConfirmEndExam] = useState(false);
  const total = session.tasks.length;
  const passed = session.tasks.filter((task) => task.passed).length;
  const repeated = session.tasks.filter((task) => task.repeated).length;
  const failed = total - passed;
  const averages = RATING_CRITERIA.map((criterion) => ({ criterion, value: averageRating(session.tasks, criterion) })).filter((item) => item.value !== undefined);
  const candidateName = session.candidateName ?? `${session.firstName} ${session.lastName}`.trim();

  return (
    <div>
      <header className="exam-header sticky top-0 z-10 border-b border-slate-700 bg-app/95 shadow-lg backdrop-blur print:static print:border-black print:bg-white print:shadow-none">
        <div className="mx-auto max-w-5xl px-3 py-3 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start justify-between gap-3 sm:items-center">
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-white print:text-black">{candidateName}</p>
                <p className="truncate text-sm text-slate-300 print:text-black">
                  {session.kind === 'general' ? session.examName : t('preparation.levelOption', { level: session.level })}
                  <span className="mx-1 text-slate-600">·</span>
                  {session.kind === 'general' ? t('preparation.levelOption', { level: session.level }) : t('exam.total', { count: session.candidateCount })}
                </p>
              </div>
              <IconButton className="shrink-0 print:hidden sm:hidden" icon="print" label={t('exam.print')} onClick={() => window.print()} />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <dl className="grid grid-cols-3 gap-2 text-center sm:flex sm:gap-4">
              <div className="rounded-md bg-slate-800 px-2 py-1 print:border print:border-slate-400 print:bg-white">
                <dt className="text-xs text-slate-300 print:text-black">{t('exam.passed')}</dt>
                <dd className="font-bold text-emerald-300 print:text-black">{passed}/{total} · {percentage(passed, total)}%</dd>
              </div>
              <div className="rounded-md bg-slate-800 px-2 py-1 print:border print:border-slate-400 print:bg-white">
                <dt className="text-xs text-slate-300 print:text-black">{t('exam.repeatedStat')}</dt>
                <dd className="font-bold text-amber-300 print:text-black">{repeated}/{total} · {percentage(repeated, total)}%</dd>
              </div>
              <div className="rounded-md bg-slate-800 px-2 py-1 print:border print:border-slate-400 print:bg-white">
                <dt className="text-xs text-slate-300 print:text-black">{t('exam.failed')}</dt>
                <dd className="font-bold text-red-300 print:text-black">{failed}/{total}</dd>
              </div>
              </dl>
              <div className="hidden sm:block print:hidden">
                <IconButton icon="print" label={t('exam.print')} onClick={() => window.print()} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-3 py-5 sm:px-6 sm:py-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div>
            <h1 className="text-xl font-bold text-white">{t('exam.title')}</h1>
            <p className="text-sm text-slate-400">{formatDate(session.date, language)}</p>
          </div>
        </div>

        {session.tasks.length > 0 ? (
          <div className="space-y-3 print:space-y-2">
            {session.tasks.map((task, index) => (
              <Fragment key={`${task.id}-${index}`}>
                {index > 0 && session.tasks[index - 1].kind !== task.kind && (
                  <hr aria-hidden="true" className="my-6! border-slate-700/70 print:border-slate-300" />
                )}
                <TaskCard number={index + 1} onChange={onTaskChange} task={task} />
              </Fragment>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-slate-700 bg-panel p-5 text-slate-300">{t('exam.noTasks')}</p>
        )}

        {averages.length > 0 && (
          <section className="mt-6 rounded-xl border border-slate-700 bg-panel p-4 print:border-slate-400 print:bg-transparent">
            <h2 className="mb-3 text-sm font-semibold text-slate-300 print:text-black">{t('rating.average')}</h2>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {averages.map(({ criterion, value }) => (
                <div className="rounded-lg bg-slate-800 px-3 py-2 print:border print:border-slate-300 print:bg-transparent" key={criterion}>
                  <dt className="text-xs text-slate-400 print:text-black">{t(ratingLabels[criterion].key)}</dt>
                  <dd className="text-lg font-bold text-primary print:text-black">{value?.toLocaleString(language, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <section className="mt-6 rounded-xl border border-slate-700 bg-panel p-4 print:border-slate-400 print:bg-transparent">
          <label className="block text-sm font-semibold text-slate-300">
            <span className="mb-2 block print:text-black">{t('exam.generalNote')}</span>
            <textarea className="mt-2 min-h-28 w-full resize-y rounded-md border border-slate-600 bg-field px-3 py-2 text-white outline-none focus:border-primary print:hidden" onChange={(event) => onGeneralNoteChange(event.target.value)} placeholder={t('exam.generalNotePlaceholder')} value={session.generalNote ?? ''} />
            <span className="mt-2 hidden whitespace-pre-wrap text-xs font-normal print:block print:text-black">{session.generalNote}</span>
          </label>
        </section>

        <div className="mt-8 flex flex-wrap justify-center gap-3 border-t border-slate-700 pt-6 print:hidden">
          <button className="rounded-md bg-primary px-5 py-3 font-semibold text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary" onClick={() => session.kind === 'general' ? onNewExam() : setConfirmNewExam(true)} type="button">
            {t('exam.newExam')}
          </button>
          <button className="rounded-md border border-slate-600 px-5 py-3 font-semibold text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary" onClick={() => setConfirmEndExam(true)} type="button">
            {t('exam.endExam')}
          </button>
        </div>
      </main>
      {confirmNewExam && (
        <Modal
          actions={(
            <>
              <button
                className="rounded-md border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
                onClick={() => setConfirmNewExam(false)}
                type="button"
              >
                {t('exam.cancel')}
              </button>
              <button
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary"
                onClick={() => {
                  setConfirmNewExam(false);
                  onNewExam();
                }}
                type="button"
              >
                {t('exam.newExam')}
              </button>
            </>
          )}
          onClose={() => setConfirmNewExam(false)}
          title={t('exam.confirmTitle')}
        >
          <p>{t('exam.confirmMessage')}</p>
        </Modal>
      )}
      {confirmEndExam && (
        <Modal
          actions={(
            <>
              <button className="rounded-md border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700" onClick={() => setConfirmEndExam(false)} type="button">{t('exam.cancel')}</button>
              <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover" onClick={() => { setConfirmEndExam(false); onEndExam(); }} type="button">{t('exam.endExam')}</button>
            </>
          )}
          onClose={() => setConfirmEndExam(false)}
          title={t('exam.endConfirmTitle')}
        >
          <p>{t('exam.endConfirmMessage')}</p>
        </Modal>
      )}
    </div>
  );
}