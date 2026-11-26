import { useMemo, useState } from 'react';
import type { Category, Technique } from '../lib/types';
import { localize } from '../i18n/localize';
import { useI18n } from '../i18n/I18nProvider';
import { IconButton } from './Icons';
import { Modal } from './Modal';

const PAGE_SIZE = 25;
const categories: (Category | 'all')[] = ['all', 'level-1', 'level-2', 'level-3', 'level-4', 'level-5', 'general', 'other'];

export function TechniquePicker({ techniques, selectedIds, onApply, onClose }: {
  techniques: Technique[];
  selectedIds: string[];
  onApply: (ids: string[]) => void;
  onClose: () => void;
}) {
  const { t, language } = useI18n();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [page, setPage] = useState(0);
  const [draftIds, setDraftIds] = useState(selectedIds);
  const filtered = useMemo(() => techniques.filter((technique) => {
    if (category !== 'all' && technique.category !== category) return false;
    const text = localize(technique, language);
    return `${text.title ?? text.text} ${text.teaser ?? ''}`.toLocaleLowerCase(language).includes(query.trim().toLocaleLowerCase(language));
  }).sort((a, b) => (localize(a, language).title ?? a.title).localeCompare(localize(b, language).title ?? b.title, language)), [category, language, query, techniques]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function categoryLabel(item: Category | 'all') {
    if (item === 'all') return t('events.all');
    if (item === 'general') return t('exam.generalTask');
    if (item === 'other') return t('category.other');
    return t('events.levelOption', { level: Number(item.slice(-1)) });
  }

  return (
    <Modal actions={<IconButton className="border-primary bg-primary text-white hover:bg-primary-hover" icon="save" label={t('events.applySelection')} onClick={() => { onApply(draftIds); onClose(); }} />} onClose={onClose} size="large" title={t('events.techniqueSearch')}>
      <div className="space-y-4">
        <label className="block text-sm text-slate-300">{t('tech.search')}<input autoFocus className="mt-1.5 min-h-11 w-full rounded-md border border-slate-600 bg-field px-3 text-white" onChange={(event) => { setQuery(event.target.value); setPage(0); }} value={query} /></label>
        <div aria-label={t('events.categoryFilter')} className="flex flex-wrap gap-2" role="group">
          {categories.map((item) => <button aria-pressed={category === item} className={`min-h-9 rounded-full border px-3 text-sm ${category === item ? 'border-primary bg-primary/15 text-primary' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}`} key={item} onClick={() => { setCategory(item); setPage(0); }} type="button">{categoryLabel(item)}</button>)}
        </div>
        <div className="divide-y divide-slate-700 rounded-lg border border-slate-700">
          {visible.map((technique) => {
            const localized = localize(technique, language);
            const selected = draftIds.includes(technique.id);
            return <button aria-pressed={selected} className={`flex min-h-14 w-full items-center gap-3 px-3 py-2 text-left ${selected ? 'bg-primary/10' : 'hover:bg-slate-800'}`} key={technique.id} onClick={() => setDraftIds((current) => selected ? current.filter((id) => id !== technique.id) : [...current, technique.id])} type="button">
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${selected ? 'border-primary bg-primary text-white' : 'border-slate-500'}`}>{selected ? '✓' : ''}</span>
              <span className="min-w-0 flex-1"><span className="block truncate font-medium text-white">{localized.title ?? localized.text}</span>{localized.teaser && <span className="block truncate text-xs text-slate-400">{localized.teaser}</span>}</span>
              <span className="shrink-0 text-xs text-slate-400">{categoryLabel(technique.category)}</span>
            </button>;
          })}
          {visible.length === 0 && <p className="p-5 text-center text-sm text-slate-400">{t('events.emptyTechniques')}</p>}
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs tabular-nums text-slate-400">{t('events.techniqueRange', { from: filtered.length ? page * PAGE_SIZE + 1 : 0, to: Math.min((page + 1) * PAGE_SIZE, filtered.length), total: filtered.length })} · {t('events.selectedCount', { count: draftIds.length })}</span>
          <div className="flex gap-2"><IconButton disabled={page === 0} icon="left" label={t('tech.previous')} onClick={() => setPage((current) => Math.max(0, current - 1))} /><IconButton disabled={page + 1 >= pageCount} icon="right" label={t('tech.next')} onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} /></div>
        </div>
      </div>
    </Modal>
  );
}