import { useState } from 'react';
import type { ExamEvent, Examiner, ExamDefinition, Technique } from '../lib/types';
import { useI18n } from '../i18n/I18nProvider';
import { PageHeader } from './PageHeader';
import type { AppRoute } from './NavigationMenu';
import { CandidateEvaluation } from './CandidateEvaluation';
import { formatDate } from '../lib/date';
import { IconButton } from './Icons';
import { passVotes } from '../lib/eventModel';

interface ExamReviewProps {
  event: ExamEvent;
  exam: ExamDefinition;
  candidateId: string;
  examiner: Examiner;
  examiners: Examiner[];
  techniques: Technique[];
  onNavigate: (route: AppRoute) => void;
  onLock: () => void;
  onChange: (event: ExamEvent) => void;
  onBack: () => void;
}

export function ExamReview({ event, exam, candidateId, examiner, examiners, techniques, onNavigate, onLock, onChange, onBack }: ExamReviewProps) {
  const { t, language } = useI18n();
  const [selectedExaminerId, setSelectedExaminerId] = useState(examiner.id);
  const candidate = event.candidates.find((item) => item.id === candidateId);
  if (!candidate) return <p className="p-8 text-slate-300">{t('events.candidateMissing')}</p>;
  const eventExaminers = [examiner, ...examiners.filter((item) => item.id !== examiner.id && event.examinerIds.includes(item.id))];
  const selectedExaminer = eventExaminers.find((item) => item.id === selectedExaminerId) ?? examiner;
  const selectedExaminerIndex = eventExaminers.findIndex((item) => item.id === selectedExaminer.id);
  const votes = passVotes(event, exam.id, candidate.id);

  function changeExaminer(delta: number) {
    const nextIndex = (selectedExaminerIndex + delta + eventExaminers.length) % eventExaminers.length;
    setSelectedExaminerId(eventExaminers[nextIndex].id);
  }

  return (
    <>
      <PageHeader activeRoute="exams" examinerShortcode={examiner.shortcode} onLock={onLock} onNavigate={onNavigate} title={`${exam.name} · ${candidate.name}`} actions={<div className="flex gap-2 print:hidden"><IconButton icon="left" label={t('events.backToList')} onClick={onBack} /><IconButton icon="print" label={t('exam.print')} onClick={() => window.print()} /><IconButton icon="mail" label={t('events.emailCandidate')} onClick={() => window.alert(t('events.emailPlaceholder'))} /></div>} />
      <main className="app-container space-y-4 py-5 sm:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700 bg-panel p-4 print:items-start print:bg-transparent print:text-black">
          <div className="min-w-0 flex-1"><h2 className="text-lg font-semibold text-white print:text-black">{candidate.name}</h2><p className="mt-1 text-sm text-slate-400 print:text-black">{event.location} · {formatDate(event.date, language)} · {event.startTime} · {t('events.levelOption', { level: exam.level })}</p></div>
          <div className="hidden text-right text-sm font-semibold text-black print:block">{selectedExaminer.name}</div>
          <span className="rounded-full border border-slate-600 px-3 py-1 text-xs font-semibold text-slate-200 print:hidden">{t('events.passVotes', votes)}</span>
        </div>
        <div aria-label={t('events.examinerSwitcher')} className="flex items-center justify-center gap-4 print:hidden" role="group">
          <IconButton icon="left" label={t('events.previousExaminer')} onClick={() => changeExaminer(-1)} />
          <span aria-live="polite" className="min-w-20 text-center text-lg font-semibold text-white" title={selectedExaminer.name}>{selectedExaminer.shortcode}</span>
          <IconButton icon="right" label={t('events.nextExaminer')} onClick={() => changeExaminer(1)} />
        </div>
        <CandidateEvaluation candidate={candidate} event={event} exam={exam} examiner={selectedExaminer} onChange={onChange} readOnly={selectedExaminer.id !== examiner.id} showSummary techniques={techniques} />
      </main>
    </>
  );
}