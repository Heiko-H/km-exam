import { useMemo, useRef, useState } from 'react';
import type { GeneralExam, Technique } from '../lib/types';
import { LEVELS } from '../lib/types';
import { localize } from '../i18n/localize';
import { useI18n } from '../i18n/I18nProvider';
import { formatDate } from '../lib/date';
import { parseGeneralExamsJson } from '../lib/generalExamImport';
import { IconButton } from './Icons';
import { Modal } from './Modal';
import { PageHeader } from './PageHeader';
import type { AppRoute } from './NavigationMenu';

interface GeneralExamListProps {
  exams: GeneralExam[];
  techniques: Technique[];
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onLock: () => void;
  onNew: () => void;
  onEdit: (exam: GeneralExam) => void;
  onDelete: (examId: string) => void;
  onRun: (exam: GeneralExam) => void;
  onImport: (exams: GeneralExam[]) => void;
}

export function GeneralExamList(props: GeneralExamListProps) {
  const { t, language } = useI18n();
  const [query, setQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<GeneralExam | null>(null);
  const [error, setError] = useState('');
  const uploadRef = useRef<HTMLInputElement>(null);
  const techniqueMap = useMemo(() => new Map(props.techniques.map((technique) => [technique.id, technique])), [props.techniques]);
  const filtered = props.exams.filter((exam) => exam.name.toLocaleLowerCase(language).includes(query.trim().toLocaleLowerCase(language)) && (levelFilter === 'all' || exam.level === Number(levelFilter)));

  async function importFile(file?: File) {
    if (!file) return;
    try {
      const imported = parseGeneralExamsJson(await file.text());
      props.onImport(imported);
      setError('');
    } catch {
      setError(t('general.importError'));
    }
    if (uploadRef.current) uploadRef.current.value = '';
  }

  function exportFile() {
    const blob = new Blob([JSON.stringify(props.exams, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'km-exam-general-exams.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader activeRoute={props.activeRoute} onLock={props.onLock} onNavigate={props.onNavigate} title={t('general.title')} />
      <main className="mx-auto max-w-5xl space-y-5 px-3 py-5 sm:px-6 sm:py-8">
        <div className="flex flex-wrap items-center gap-2">
          <button className="inline-flex min-h-10 items-center gap-2 rounded-md bg-primary px-4 font-semibold text-white hover:bg-primary-hover" onClick={props.onNew} type="button"><span aria-hidden="true">＋</span>{t('general.new')}</button>
          <input accept="application/json,.json" className="hidden" onChange={(event) => void importFile(event.target.files?.[0])} ref={uploadRef} type="file" />
          <IconButton icon="upload" label={t('general.upload')} onClick={() => uploadRef.current?.click()} />
          <IconButton icon="download" label={t('general.download')} onClick={exportFile} />
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
          <label className="text-sm font-medium text-slate-300">
            {t('general.search')}
            <input className="mt-1 min-h-11 w-full rounded-md border border-slate-600 bg-field px-3 text-white outline-none focus:border-primary" onChange={(event) => setQuery(event.target.value)} value={query} />
          </label>
          <label className="text-sm font-medium text-slate-300">
            {t('general.levelFilter')}
            <select className="mt-1 min-h-11 w-full rounded-md border border-slate-600 bg-field px-3 text-white outline-none focus:border-primary" onChange={(event) => setLevelFilter(event.target.value)} value={levelFilter}>
              <option value="all">{t('general.allLevels')}</option>
              {LEVELS.map((level) => <option key={level} value={level}>{t('preparation.levelOption', { level })}</option>)}
            </select>
          </label>
        </div>
        {error && <p className="rounded-md border border-red-800 bg-red-950/60 p-3 text-sm text-red-200" role="alert">{error}</p>}
        {filtered.length === 0 ? <p className="rounded-xl border border-slate-700 bg-panel p-5 text-slate-300">{t('general.empty')}</p> : (
          <div className="space-y-2">
            {filtered.map((exam) => (
              <details className="rounded-xl border border-slate-700 bg-panel" key={exam.id}>
                <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-4 [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0 flex-1 truncate font-semibold text-white">{exam.name}{exam.date && <span className="ml-2 font-normal text-slate-400">· {formatDate(exam.date, language)}</span>}</span>
                  <span className="shrink-0 rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300">{t('preparation.levelOption', { level: exam.level })}</span>
                </summary>
                <div className="border-t border-slate-700 px-4 py-3">
                  <ol className="mb-4 list-decimal space-y-1 pl-5 text-sm text-slate-300">
                    {exam.techniqueIds.map((id) => {
                      const technique = techniqueMap.get(id);
                      const localized = technique && localize(technique, language);
                      return <li key={id}>{localized?.text ?? id}</li>;
                    })}
                  </ol>
                  <div className="flex flex-wrap justify-end gap-2">
                    <IconButton icon="play" label={t('general.run')} onClick={() => props.onRun(exam)} />
                    <IconButton icon="edit" label={t('general.edit')} onClick={() => props.onEdit(exam)} />
                    <IconButton icon="delete" label={t('general.delete')} onClick={() => setDeleteTarget(exam)} />
                  </div>
                </div>
              </details>
            ))}
          </div>
        )}
      </main>
      {deleteTarget && (
        <Modal onClose={() => setDeleteTarget(null)} title={t('general.delete')}>
          <p>{t('general.confirmDelete')}</p>
          <div className="mt-6 flex justify-end gap-2">
            <button className="rounded-md border border-slate-600 px-4 py-2 text-sm text-slate-200" onClick={() => setDeleteTarget(null)} type="button">{t('exam.cancel')}</button>
            <button className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600" onClick={() => { props.onDelete(deleteTarget.id); setDeleteTarget(null); }} type="button">{t('general.delete')}</button>
          </div>
        </Modal>
      )}
    </>
  );
}