import { useState } from 'react';
import type { GeneralExam } from '../lib/types';
import { useI18n } from '../i18n/I18nProvider';
import { Modal } from './Modal';

export function GeneralExamRun({ exam, onCancel, onStart }: { exam: GeneralExam; onCancel: () => void; onStart: (candidateName: string) => void }) {
  const { t } = useI18n();
  const [candidateName, setCandidateName] = useState('');

  return (
    <Modal onClose={onCancel} title={exam.name}>
      <label className="block text-sm font-medium text-slate-300">
        {t('general.candidate')}
        <input autoFocus className="mt-1 min-h-11 w-full rounded-md border border-slate-600 bg-field px-3 text-white outline-none focus:border-primary" onChange={(event) => setCandidateName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && candidateName.trim()) onStart(candidateName.trim()); }} value={candidateName} />
      </label>
      <div className="mt-5 flex justify-end gap-2">
        <button className="rounded-md border border-slate-600 px-4 py-2 text-sm text-slate-200" onClick={onCancel} type="button">{t('exam.cancel')}</button>
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40" disabled={!candidateName.trim()} onClick={() => onStart(candidateName.trim())} type="button">{t('general.start')}</button>
      </div>
    </Modal>
  );
}