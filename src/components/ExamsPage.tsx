import { useMemo, useState } from 'react';
import type { ExamEvent, Examiner, Technique } from '../lib/types';
import type { AppRoute } from './NavigationMenu';
import { EventList } from './EventList';
import { createEmptyEvent } from './EventEditor';
import { EventPage } from './EventPage';
import { ExamRunner } from './ExamRunner';
import { ExamReview } from './ExamReview';

interface ExamsPageProps {
  events: ExamEvent[];
  examiners: Examiner[];
  techniques: Technique[];
  examiner: Examiner;
  onEventsChange: (events: ExamEvent[]) => void;
  onNavigate: (route: AppRoute) => void;
  onLock: () => void;
}

type View = 'list' | 'event' | 'run' | 'review';

export function ExamsPage({ events, examiners, techniques, examiner, onEventsChange, onNavigate, onLock }: ExamsPageProps) {
  const [view, setView] = useState<View>('list');
  const [draftEvent, setDraftEvent] = useState<ExamEvent | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [activeExamId, setActiveExamId] = useState<string | null>(null);
  const [activeCandidateId, setActiveCandidateId] = useState<string | null>(null);
  const activeEvent = useMemo(() => events.find((item) => item.id === activeEventId), [activeEventId, events]);
  const activeExam = activeEvent?.exams.find((item) => item.id === activeExamId);

  function openEvent(event: ExamEvent) {
    setDraftEvent(event);
    setIsNew(false);
    setActiveEventId(event.id);
    setView('event');
  }

  function createEvent() {
    const event = createEmptyEvent(examiner.id);
    setDraftEvent(event);
    setIsNew(true);
    setActiveEventId(event.id);
    setView('event');
  }

  function saveEvent(event: ExamEvent) {
    onEventsChange(isNew ? [...events, event] : events.map((item) => item.id === event.id ? event : item));
    setDraftEvent(event);
    setIsNew(false);
    setActiveEventId(event.id);
    setView('event');
  }

  function updateActiveEvent(event: ExamEvent) {
    onEventsChange(events.map((item) => item.id === event.id ? event : item));
    setDraftEvent(event);
  }

  function runExam(event: ExamEvent, examId: string) {
    setActiveEventId(event.id);
    setActiveExamId(examId);
    setView('run');
  }

  function reviewCandidate(event: ExamEvent, examId: string, candidateId: string) {
    setActiveEventId(event.id);
    setActiveExamId(examId);
    setActiveCandidateId(candidateId);
    setView('review');
  }

  const eventPageEvent = activeEvent ?? draftEvent;
  if (view === 'event' && eventPageEvent) return <EventPage activeExaminerId={examiner.id} event={eventPageEvent} examiners={examiners} isNew={isNew} onCancel={() => { setDraftEvent(null); setActiveEventId(null); setIsNew(false); setView('list'); }} onChange={updateActiveEvent} onDelete={(eventId) => { onEventsChange(events.filter((item) => item.id !== eventId)); setDraftEvent(null); setActiveEventId(null); setView('list'); }} onLock={onLock} onNavigate={onNavigate} onReview={reviewCandidate} onRun={runExam} onSave={saveEvent} techniques={techniques} />;
  if (view === 'run' && activeEvent && activeExam) return <ExamRunner event={activeEvent} exam={activeExam} examiner={examiner} onChange={updateActiveEvent} onEnd={() => setView('event')} techniques={techniques} />;
  if (view === 'review' && activeEvent && activeExam && activeCandidateId) return <ExamReview candidateId={activeCandidateId} event={activeEvent} exam={activeExam} examiner={examiner} examiners={examiners} onBack={() => setView('event')} onChange={updateActiveEvent} onLock={onLock} onNavigate={onNavigate} techniques={techniques} />;

  return <EventList activeExaminerId={examiner.id} events={events} examiners={examiners} onCreate={createEvent} onLock={onLock} onNavigate={onNavigate} onOpen={openEvent} />;
}