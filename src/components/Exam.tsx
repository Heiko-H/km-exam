import type { ExamSession, ExamTask } from '../lib/types';

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
  onChange: ExamProps['onTaskChange'];
}

function TaskCard({ task, onChange }: TaskCardProps) {
  const statusClass = 'rounded-md border px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary';

  return (
    <article className="exam-task rounded-xl border border-slate-700 bg-panel p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {task.kind === 'technique' ? `Technik · Stufe ${task.level}` : 'Allgemeine Aufgabe'}
            </span>
            {task.repeated && <span className="rounded-full bg-amber-950 px-2 py-0.5 text-xs font-medium text-amber-200">Wiederholung</span>}
          </div>
          <h3 className="text-lg font-semibold text-white">{task.text}</h3>
          {task.details && (
            <details className="mt-2 text-sm text-slate-300">
              <summary className="w-fit cursor-pointer select-none text-primary underline decoration-dotted underline-offset-4">Details anzeigen</summary>
              <p className="mt-2 rounded-md border-l-2 border-primary bg-slate-800/70 px-3 py-2">{task.details}</p>
            </details>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
          <button
            aria-pressed={task.passed}
            className={`${statusClass} ${task.passed ? 'border-emerald-500 bg-emerald-900 text-emerald-100' : 'border-slate-600 text-slate-200 hover:bg-slate-800'}`}
            onClick={() => onChange(task.id, { passed: true, failed: false })}
            type="button"
          >
            Bestanden
          </button>
          <button
            aria-pressed={task.repeated}
            className={`${statusClass} ${task.repeated ? 'border-amber-500 bg-amber-900 text-amber-100' : 'border-slate-600 text-slate-200 hover:bg-slate-800'}`}
            onClick={() => onChange(task.id, { repeated: !task.repeated })}
            type="button"
          >
            Wiederholung
          </button>
          <button
            aria-pressed={task.failed}
            className={`${statusClass} ${task.failed ? 'border-red-500 bg-red-900 text-red-100' : 'border-slate-600 text-slate-200 hover:bg-slate-800'}`}
            onClick={() => onChange(task.id, { failed: true, passed: false })}
            type="button"
          >
            Nicht bestanden
          </button>
        </div>
      </div>
      <details className="mt-4 border-t border-slate-700 pt-3">
        <summary className="w-fit cursor-pointer text-sm font-medium text-slate-300">Merktext zur Aufgabe</summary>
        <label className="mt-3 block text-sm text-slate-300">
          Notiz
          <textarea
            className="mt-1 min-h-20 w-full resize-y rounded-md border border-slate-600 bg-field px-3 py-2 text-white outline-none focus:border-primary"
            onChange={(event) => onChange(task.id, { note: event.target.value })}
            placeholder="Notiz während der Prüfung …"
            value={task.note}
          />
        </label>
      </details>
    </article>
  );
}

export function Exam({ session, onTaskChange, onNewExam }: ExamProps) {
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
              <p className="text-sm text-slate-300 print:text-black">Stufe {session.level} <span className="mx-1 text-slate-600">·</span> Gesamt: {session.candidateCount} Prüflinge</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <dl className="grid grid-cols-3 gap-2 text-center sm:flex sm:gap-4">
              <div className="rounded-md bg-slate-800 px-2 py-1 print:border print:border-slate-400 print:bg-white">
                <dt className="text-xs text-slate-300 print:text-black">Bestanden</dt>
                <dd className="font-bold text-emerald-300 print:text-black">{passed}/{total} · {percentage(passed, total)}%</dd>
              </div>
              <div className="rounded-md bg-slate-800 px-2 py-1 print:border print:border-slate-400 print:bg-white">
                <dt className="text-xs text-slate-300 print:text-black">Wiederholt</dt>
                <dd className="font-bold text-amber-300 print:text-black">{repeated}/{total} · {percentage(repeated, total)}%</dd>
              </div>
              <div className="rounded-md bg-slate-800 px-2 py-1 print:border print:border-slate-400 print:bg-white">
                <dt className="text-xs text-slate-300 print:text-black">Nicht bestanden</dt>
                <dd className="font-bold text-red-300 print:text-black">{failed}/{total}</dd>
              </div>
              </dl>
              <button
                className="rounded-md border border-slate-600 px-4 py-2 font-medium text-slate-100 hover:bg-slate-800 print:hidden"
                onClick={() => window.print()}
                type="button"
              >
                Drucken / PDF
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-3 py-5 sm:px-6 sm:py-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div>
            <h1 className="text-xl font-bold text-white">Prüfungsaufgaben</h1>
            <p className="text-sm text-slate-400">{session.date}</p>
          </div>
        </div>

        {session.tasks.length > 0 ? (
          <div className="space-y-3 print:space-y-4">
            {session.tasks.map((task, index) => <TaskCard key={`${task.id}-${index}`} onChange={onTaskChange} task={task} />)}
          </div>
        ) : (
          <p className="rounded-xl border border-slate-700 bg-panel p-5 text-slate-300">Für diese Prüfung wurden keine Aufgaben ausgewählt.</p>
        )}

        <div className="mt-8 border-t border-slate-700 pt-6 text-center print:hidden">
          <button className="rounded-md bg-primary px-5 py-3 font-semibold text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary" onClick={onNewExam} type="button">
            Neue Prüfung beginnen
          </button>
        </div>
      </main>
    </div>
  );
}