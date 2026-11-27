import { useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { ExamEvent, Examiner, Level } from '../lib/types';
import { isInvolved, sortEvents } from '../lib/eventModel';
import { PageHeader } from './PageHeader';
import type { AppRoute } from './NavigationMenu';
import { useI18n } from '../i18n/I18nProvider';
import { formatDate } from '../lib/date';

interface EventListProps {
  events: ExamEvent[];
  examiners: Examiner[];
  activeExaminerId: string;
  onNavigate: (route: AppRoute) => void;
  onLock: () => void;
  onCreate: () => void;
  onOpen: (event: ExamEvent) => void;
}

type SortKey = 'date' | 'location' | 'candidates';

export function EventList({ events, examiners, activeExaminerId, onNavigate, onLock, onCreate, onOpen }: EventListProps) {
  const { t, language } = useI18n();
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState<Level | 'all'>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [involvedOnly, setInvolvedOnly] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const collator = useMemo(() => new Intl.Collator(language, { sensitivity: 'base', numeric: true }), [language]);
  const visibleEvents = useMemo(() => {
    const filtered = events.filter((event) => {
      if (showArchived ? !event.archived : event.archived) return false;
      if (involvedOnly && !isInvolved(event, activeExaminerId)) return false;
      if (level !== 'all' && !event.exams.some((exam) => exam.level === level)) return false;
      return `${event.location} ${event.details}`.toLocaleLowerCase(language).includes(query.trim().toLocaleLowerCase(language));
    });
    if (sortKey === 'date' && sortDirection === 'asc') return sortEvents(filtered);
    const getValue = (event: ExamEvent): string | number => {
      switch (sortKey) {
        case 'date': return event.date;
        case 'location': return event.location || t('events.unnamed');
        case 'candidates': return event.candidates.length;
      }
    };
    return filtered.sort((a, b) => {
      const left = getValue(a);
      const right = getValue(b);
      const result = typeof left === 'number' && typeof right === 'number' ? left - right : collator.compare(String(left), String(right));
      return result * (sortDirection === 'asc' ? 1 : -1);
    });
  }, [activeExaminerId, collator, events, examiners, involvedOnly, language, level, query, showArchived, sortDirection, sortKey, t]);
  const shortcode = examiners.find((item) => item.id === activeExaminerId)?.shortcode;
  const columns: { key?: SortKey; label: string }[] = [
    { key: 'date', label: t('events.date') },
    { label: t('events.startTime') },
    { key: 'location', label: t('events.location') },
    { label: t('events.exams') },
    { key: 'candidates', label: t('events.candidates') },
    { label: t('events.examiners') },
  ];

  function sortBy(key: SortKey) {
    if (sortKey === key) setSortDirection((current) => current === 'asc' ? 'desc' : 'asc');
    else {
      setSortKey(key);
      setSortDirection('asc');
    }
  }

  function openOnKeyboard(event: KeyboardEvent<HTMLTableRowElement>, item: ExamEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpen(item);
    }
  }

  return (
    <>
      <PageHeader activeRoute="exams" examinerShortcode={shortcode} onLock={onLock} onNavigate={onNavigate} title={t('events.title')} />
      <main className="app-container space-y-5 py-5 sm:py-8">
        <div className="flex flex-wrap items-center gap-3">
          <button className="rounded-md bg-primary px-4 py-2 font-semibold text-white hover:bg-primary-hover" onClick={onCreate} type="button">{t('events.new')}</button>
          <label className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-600 px-3 text-sm text-slate-200">
            <input checked={involvedOnly} className="accent-primary" onChange={(event) => setInvolvedOnly(event.target.checked)} type="checkbox" />
            {t('events.involvedOnly')}
          </label>
          <label className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-600 px-3 text-sm text-slate-200">
            <input checked={showArchived} className="accent-primary" onChange={(event) => setShowArchived(event.target.checked)} type="checkbox" />
            {t('events.archived')}
          </label>
        </div>
        <div className="space-y-3">
          <label className="text-sm text-slate-300">{t('events.search')}
            <input className="mt-1.5 min-h-11 w-full rounded-md border border-slate-600 bg-field px-3 text-white" onChange={(event) => setQuery(event.target.value)} value={query} />
          </label>
          <fieldset>
            <legend className="mb-1.5 text-sm text-slate-300">{t('events.level')}</legend>
            <div className="flex flex-wrap gap-2">
              {(['all', 1, 2, 3, 4, 5] as const).map((item) => <button aria-pressed={level === item} className={`min-h-9 rounded-md border px-3 text-sm ${level === item ? 'border-primary bg-primary/15 text-primary' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}`} key={item} onClick={() => setLevel(item)} type="button">{item === 'all' ? t('events.allLevels') : item}</button>)}
            </div>
          </fieldset>
        </div>
        {visibleEvents.length === 0 ? <p className="rounded-xl border border-slate-700 bg-panel p-6 text-slate-400">{t('events.empty')}</p> : <div className="overflow-x-auto rounded-xl border border-slate-700 bg-panel">
          <table className="w-full min-w-[820px] border-collapse text-left text-sm">
            <thead className="bg-app/70 text-xs uppercase tracking-wide text-slate-400"><tr>{columns.map((column) => <th aria-sort={column.key ? sortKey === column.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none' : undefined} className="border-b border-slate-700 px-4 py-3" key={column.key ?? column.label} scope="col">{column.key ? <button className="inline-flex items-center gap-1.5 whitespace-nowrap hover:text-white" onClick={() => sortBy(column.key!)} title={t('events.sortBy', { label: column.label })} type="button">{column.label}{sortKey === column.key && <span aria-hidden="true">{sortDirection === 'asc' ? '↑' : '↓'}</span>}</button> : column.label}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-700/80">
              {visibleEvents.map((event) => <tr className="cursor-pointer text-slate-200 outline-none transition-colors hover:bg-slate-800/70 focus:bg-slate-800/70" key={event.id} onClick={() => onOpen(event)} onKeyDown={(keyboardEvent) => openOnKeyboard(keyboardEvent, event)} role="link" tabIndex={0} title={t('events.openEvent')}>
                <td className="whitespace-nowrap px-4 py-3 text-primary">{event.date ? formatDate(event.date, language) : '—'}</td>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums">{event.startTime || '—'}</td>
                <td className="min-w-48 px-4 py-3 font-semibold text-white">{event.location || t('events.unnamed')}</td>
                <td className="max-w-72 px-4 py-3"><div className="flex flex-wrap gap-1.5">{event.exams.length ? event.exams.map((exam) => <span className="rounded-full border border-slate-600 px-2 py-0.5 text-xs" key={exam.id}>{exam.name} · {exam.level}</span>) : '—'}</div></td>
                <td className="px-4 py-3 tabular-nums">{event.candidates.length}</td>
                <td className="px-4 py-3"><div className="flex flex-wrap gap-1.5">{event.examinerIds.length ? event.examinerIds.map((id) => <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs" key={id} title={examiners.find((item) => item.id === id)?.name}>{examiners.find((item) => item.id === id)?.shortcode ?? '—'}</span>) : '—'}</div></td>
              </tr>)}
            </tbody>
          </table>
        </div>}
      </main>
    </>
  );
}