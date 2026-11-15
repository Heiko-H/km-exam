import { Fragment, useState } from 'react';
import type { ExamSession, ExamTask } from '../lib/types';
import { Modal } from './Modal';
import { InfoButton } from './InfoButton';
import { useI18n } from '../i18n/I18nProvider';
import { localize } from '../i18n/localize';

interface ExamProps {
  session: ExamSession;
  onTaskChange: (taskId: string, changes: Partial<Pick<ExamTask, 'passed' | 'failed' | 'repeated' | 'note'>>) => void;
  onNewExam: () => void;
}

function percentage(value: number, total: number): number {
  return total === 0 ? 0 : Math.round((value / total) * 100);
}

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
  const statusClass = 'rounded-md border px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary';

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
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end print:ml-auto print:block print:shrink-0">
          <button
            aria-pressed={task.passed}
            className={`${statusClass} print:hidden ${task.passed ? 'border-emerald-500 bg-emerald-900 text-emerald-100' : 'border-slate-600 text-slate-200 hover:bg-slate-800'}`}
            onClick={() => onChange(task.id, { passed: true, failed: false })}
            type="button"
          >
            {t('exam.passed')}
          </button>
          <button
            aria-pressed={task.repeated}
            className={`${statusClass} print:hidden ${task.repeated ? 'border-amber-500 bg-amber-900 text-amber-100' : 'border-slate-600 text-slate-200 hover:bg-slate-800'}`}
            onClick={() => onChange(task.id, { repeated: !task.repeated })}
            type="button"
          >
            {t('exam.repeated')}
          </button>
          <button
            aria-pressed={task.failed}
            className={`${statusClass} print:hidden ${task.failed ? 'border-red-500 bg-red-900 text-red-100' : 'border-slate-600 text-slate-200 hover:bg-slate-800'}`}
            onClick={() => onChange(task.id, { failed: true, passed: false })}
            type="button"
          >
            {t('exam.failed')}
          </button>
          <span className="hidden whitespace-nowrap text-sm font-semibold print:inline">
            {task.passed && (
              <>
                <span className="print-status-passed">{t('exam.passed')}</span>
                {task.repeated && t('exam.repeatedSuffix')}
              </>
            )}
            {task.failed && (
              <>
                <span className="print-status-failed">{t('exam.failed')}</span>
                {task.repeated && t('exam.repeatedSuffix')}
              </>
            )}
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

export function Exam({ session, onTaskChange, onNewExam }: ExamProps) {
  const { t } = useI18n();
  const [confirmNewExam, setConfirmNewExam] = useState(false);
  const total = session.tasks.length;
  const passed = session.tasks.filter((task) => task.passed).length;
  const repeated = session.tasks.filter((task) => task.repeated).length;
  const failed = session.tasks.filter((task) => task.failed).length;

  return (
    <div>
      <header className="exam-header sticky top-0 z-10 border-b border-slate-700 bg-app/95 shadow-lg backdrop-blur print:static print:border-black print:bg-white print:shadow-none">
        <div className="mx-auto max-w-5xl px-3 py-3 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-white print:text-black">{session.firstName} {session.lastName}</p>
              <p className="text-sm text-slate-300 print:text-black">{t('preparation.levelOption', { level: session.level })} <span className="mx-1 text-slate-600">·</span> {t('exam.total', { count: session.candidateCount })}</p>
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
              <button
                className="rounded-md border border-slate-600 px-4 py-2 font-medium text-slate-100 hover:bg-slate-800 print:hidden"
                onClick={() => window.print()}
                type="button"
              >
                {t('exam.print')}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-3 py-5 sm:px-6 sm:py-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div>
            <h1 className="text-xl font-bold text-white">{t('exam.title')}</h1>
            <p className="text-sm text-slate-400">{session.date}</p>
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

        <div className="mt-8 border-t border-slate-700 pt-6 text-center print:hidden">
          <button className="rounded-md bg-primary px-5 py-3 font-semibold text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary" onClick={() => setConfirmNewExam(true)} type="button">
            {t('exam.newExam')}
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
    </div>
  );
}