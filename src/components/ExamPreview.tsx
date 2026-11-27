import { useState } from 'react';
import type { ExamDefinition, Technique } from '../lib/types';
import { localize } from '../i18n/localize';
import { useI18n } from '../i18n/I18nProvider';
import { IconButton } from './Icons';
import { Modal } from './Modal';
import { RichText } from './RichText';

interface ExamPreviewProps {
  exam: ExamDefinition;
  techniques: Technique[];
  date: string;
  startTime: string;
  onClose: () => void;
}

export function ExamPreview({ exam, techniques, date, startTime, onClose }: ExamPreviewProps) {
  const { t, language } = useI18n();
  const [selectedTechnique, setSelectedTechnique] = useState<Technique | null>(null);

  return (
    <>
      <Modal onClose={onClose} title={exam.name}>
        <div className="space-y-4">
          <dl className="grid gap-3 rounded-lg border border-slate-700 p-3 text-sm sm:grid-cols-3">
            <div><dt className="text-xs text-slate-400">{t('events.examLevel')}</dt><dd className="mt-1 font-medium text-white">{t('events.levelOption', { level: exam.level })}</dd></div>
            <div><dt className="text-xs text-slate-400">{t('events.techniqueCount')}</dt><dd className="mt-1 font-medium text-white">{exam.techniqueIds.length}</dd></div>
            <div><dt className="text-xs text-slate-400">{t('events.date')}</dt><dd className="mt-1 font-medium text-white">{[date, startTime].filter(Boolean).join(' · ') || '—'}</dd></div>
          </dl>
          {exam.techniqueIds.length === 0 ? <p className="rounded-lg border border-slate-700 p-3 text-sm text-slate-400">{t('events.noTechniques')}</p> : <ol className="divide-y divide-slate-700 rounded-lg border border-slate-700">
            {exam.techniqueIds.map((id, index) => {
              const technique = techniques.find((item) => item.id === id);
              const text = technique ? localize(technique, language) : null;
              return <li className="flex items-center gap-3 px-3 py-2.5" key={`${id}-${index}`}>
                <span className="w-6 shrink-0 text-right text-xs text-primary/80">{index + 1}.</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{text?.title ?? t('events.missingTechnique')}</p>
                  {text?.teaser && <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">{text.teaser}</p>}
                </div>
                {technique && <IconButton className="h-9 w-9 shrink-0" icon="eye" label={t('events.viewTechnique', { title: text?.title ?? technique.title })} onClick={() => setSelectedTechnique(technique)} />}
              </li>;
            })}
          </ol>}
        </div>
      </Modal>
      {selectedTechnique && (() => {
        const text = localize(selectedTechnique, language);
        return <Modal onClose={() => setSelectedTechnique(null)} title={text.title}>
          <div className="space-y-3">
            {text.teaser && <p className="text-sm font-medium text-slate-300">{text.teaser}</p>}
            {text.details?.trim() ? <RichText html={text.details} /> : <p className="text-sm text-slate-400">{t('events.noTechniqueDetails')}</p>}
          </div>
        </Modal>;
      })()}
    </>
  );
}