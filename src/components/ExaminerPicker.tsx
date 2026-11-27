import { useId, useMemo, useState, type FocusEvent, type KeyboardEvent } from 'react';
import type { Examiner } from '../lib/types';
import { useI18n } from '../i18n/I18nProvider';

interface ExaminerPickerProps {
  examiners: Examiner[];
  examinerIds: string[];
  activeExaminerId: string;
  assignedExaminerIds: string[];
  onChange: (examinerIds: string[]) => void;
}

function normalized(value: string, language: string): string {
  return value.toLocaleLowerCase(language).normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

export function ExaminerPicker({ examiners, examinerIds, activeExaminerId, assignedExaminerIds, onChange }: ExaminerPickerProps) {
  const { t, language } = useI18n();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const id = useId().replace(/:/g, '');
  const inputId = `examiner-search-${id}`;
  const listId = `examiner-options-${id}`;
  const linkedExaminers = examinerIds.map((examinerId) => examiners.find((item) => item.id === examinerId)).filter((item): item is Examiner => Boolean(item));
  const matchingExaminers = useMemo(() => {
    const normalizedQuery = normalized(query.trim(), language);
    const collator = new Intl.Collator(language, { sensitivity: 'base' });
    return examiners
      .filter((item) => !examinerIds.includes(item.id))
      .filter((item) => !normalizedQuery || [item.shortcode, item.name, item.email].some((value) => normalized(value, language).includes(normalizedQuery)))
      .sort((left, right) => collator.compare(left.name, right.name))
      .slice(0, 8);
  }, [examinerIds, examiners, language, query]);

  function addExaminer(examinerId: string) {
    if (!examinerIds.includes(examinerId)) onChange([...examinerIds, examinerId]);
    setQuery('');
    setActiveIndex(0);
    setOpen(false);
  }

  function removeExaminer(examinerId: string) {
    onChange(examinerIds.filter((id) => id !== examinerId));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' && matchingExaminers.length) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => current < 0 ? 0 : (current + 1) % matchingExaminers.length);
    } else if (event.key === 'ArrowUp' && matchingExaminers.length) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => current < 0 ? matchingExaminers.length - 1 : (current + matchingExaminers.length - 1) % matchingExaminers.length);
    } else if (event.key === 'Enter' && open && matchingExaminers[activeIndex]) {
      event.preventDefault();
      addExaminer(matchingExaminers[activeIndex].id);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  }

  function closeOnBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
  }

  return (
    <div className="space-y-3" onBlur={closeOnBlur}>
      <div className="relative">
        <label className="block text-sm text-slate-300" htmlFor={inputId}>{t('events.searchExaminer')}
          <input aria-activedescendant={open && matchingExaminers[activeIndex] ? `${listId}-${matchingExaminers[activeIndex].id}` : undefined} aria-autocomplete="list" aria-controls={open ? listId : undefined} aria-expanded={open} autoComplete="off" className="mt-1.5 min-h-11 w-full rounded-md border border-slate-600 bg-field px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary" id={inputId} onChange={(event) => { setQuery(event.target.value); setOpen(true); setActiveIndex(0); }} onFocus={() => { setOpen(true); setActiveIndex(-1); }} onKeyDown={handleKeyDown} role="combobox" value={query} />
        </label>
        {open && <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-slate-600 bg-panel shadow-xl" id={listId} role="listbox">
          {matchingExaminers.length ? matchingExaminers.map((item, index) => <div aria-selected={index === activeIndex} className={`min-h-11 cursor-pointer px-3 py-2 text-sm ${index === activeIndex ? 'bg-primary/15 text-primary' : 'text-slate-200 hover:bg-slate-700'}`} id={`${listId}-${item.id}`} key={item.id} onClick={() => addExaminer(item.id)} onMouseDown={(event) => event.preventDefault()} onMouseEnter={() => setActiveIndex(index)} role="option">
            <span className="font-medium">{item.shortcode}</span><span className="ml-2">{item.name}</span><span className="ml-2 text-xs text-slate-400">{item.email}</span>
          </div>) : <p className="p-3 text-sm text-slate-400" role="status">{t('events.noExaminerMatches')}</p>}
        </div>}
      </div>
      <ul className="space-y-2">
        {linkedExaminers.map((item) => {
          const hasCandidates = assignedExaminerIds.includes(item.id);
          const isActiveExaminer = item.id === activeExaminerId;
          const locked = hasCandidates || isActiveExaminer;
          return <li className="flex min-h-11 items-center gap-3 rounded-md border border-slate-700 px-3 py-2" key={item.id}>
            <span className="min-w-0 flex-1 truncate text-sm text-slate-200"><strong className="mr-2 text-white">{item.shortcode}</strong>{item.name}</span>
            <button aria-label={t('events.removeExaminer', { name: item.name })} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-600 text-lg leading-none text-slate-300 hover:border-red-800 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50" disabled={locked} onClick={() => removeExaminer(item.id)} title={hasCandidates ? t('events.examinerHasCandidates') : isActiveExaminer ? t('events.cannotRemoveSelf') : undefined} type="button">×</button>
          </li>;
        })}
      </ul>
    </div>
  );
}