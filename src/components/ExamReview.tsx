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
  const candidate = event.candidates.find((item) => item.id === candidateId);
  if (!candidate) return <p className="p-8 text-slate-300">{t('events.candidateMissing')}</p>;
  const eventExaminers = [examiner, ...examiners.filter((item) => item.id !== examiner.id && event.examinerIds.includes(item.id))];
  const votes = passVotes(event, exam.id, candidate.id);

  return (
    <>
      <PageHeader activeRoute="exams" examinerShortcode={examiner.shortcode} onLock={onLock} onNavigate={onNavigate} title={`${exam.name} · ${candidate.name}`} actions={<div className="flex gap-2 print:hidden"><IconButton icon="print" label={t('exam.print')} onClick={() => window.print()} /><button className="rounded-md border border-primary px-3 py-2 text-sm text-primary" onClick={() => window.alert(t('events.emailPlaceholder'))} type="button">{t('events.emailCandidate')}</button></div>} />
      <main className="mx-auto max-w-5xl space-y-4 px-3 py-5 sm:px-6 sm:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700 bg-panel p-4 print:bg-transparent print:text-black">
          <div><h2 className="text-lg font-semibold text-white print:text-black">{candidate.name}</h2><p className="mt-1 text-sm text-slate-400 print:text-black">{event.location} · {formatDate(event.date, language)} · {event.startTime} · {t('events.levelOption', { level: exam.level })}</p></div>
          <span className="rounded-full border border-slate-600 px-3 py-1 text-xs font-semibold text-slate-200 print:border-0 print:p-0 print:text-black">{t('events.passVotes', votes)}</span>
          <button className="rounded-md border border-slate-600 px-3 py-2 text-sm text-slate-200 print:hidden" onClick={onBack} type="button">{t('events.backToList')}</button>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <span className="mr-1 text-sm text-slate-400">{t('events.examinerResults')}</span>
          {eventExaminers.map((item) => {
            const result = event.results[exam.id]?.[candidate.id]?.[item.id];
            return <span className={`rounded-full border px-3 py-1 text-xs ${result?.passed ? 'border-emerald-700 bg-emerald-950/40 text-emerald-300' : result?.passed === false ? 'border-red-800 bg-red-950/40 text-red-300' : 'border-slate-600 text-slate-400'}`} key={item.id} title={item.name}>{item.shortcode}: {result?.passed === undefined ? t('events.notRated') : result.passed ? t('exam.passed') : t('exam.failed')}</span>;
          })}
        </div>
        <CandidateEvaluation candidate={candidate} event={event} exam={exam} examiner={examiner} onChange={onChange} showSummary techniques={techniques} />
      </main>
    </>
  );
}