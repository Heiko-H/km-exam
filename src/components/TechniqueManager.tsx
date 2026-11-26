import { useMemo, useState } from 'react';
import { localize } from '../i18n/localize';
import { useI18n } from '../i18n/I18nProvider';
import type { Category, Language, Tag, Technique, TranslationLanguage } from '../lib/types';
import { FlagIcon } from './LanguageSelect';
import { IconButton } from './Icons';
import { Modal } from './Modal';
import { PageHeader } from './PageHeader';
import type { AppRoute } from './NavigationMenu';
import { RichTextEditor } from './RichTextEditor';

const languages: Language[] = ['en', 'it', 'de', 'fr', 'es'];
const categories: Category[] = ['level-1', 'level-2', 'level-3', 'level-4', 'level-5', 'general', 'other'];
type SortKey = 'name' | 'category' | 'tags' | 'modified';

function categoryName(category: Category, t: ReturnType<typeof useI18n>['t']): string {
  if (category === 'general') return t('exam.generalTask');
  if (category === 'other') return t('category.other');
  return t('preparation.levelOption', { level: Number(category.slice(-1)) });
}

function newTechnique(): Technique {
  return { id: crypto.randomUUID(), title: '', text: '', teaser: '', category: 'other', tags: [], modification_date: new Date().toISOString() };
}

function localizedText(item: Technique, language: Language) {
  if (language === 'de') return { title: item.title || item.text, teaser: item.teaser ?? '', details: item.details ?? '' };
  const translation = item.translations?.[language];
  return { title: translation?.title ?? translation?.text ?? '', teaser: translation?.teaser ?? '', details: translation?.details ?? '' };
}

interface TechniqueManagerProps {
  items: Technique[];
  tags: Tag[];
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onLock: () => void;
  onSaveItem: (item: Technique) => void;
  onSaveTag: (tag: Tag) => void;
}

export function TechniqueManager({ items, tags, activeRoute, onNavigate, onLock, onSaveItem, onSaveTag }: TechniqueManagerProps) {
  const { t, language } = useI18n();
  const [tab, setTab] = useState<'techniques' | 'tags'>('techniques');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number | 'all'>(20);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [editingItem, setEditingItem] = useState<Technique | null>(null);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const localizedTags = useMemo(() => new Map(tags.map((tag) => [tag.id, localize(tag, language).text])), [tags, language]);
  const collator = useMemo(() => new Intl.Collator(language, { numeric: true, sensitivity: 'base' }), [language]);
  const normalizedQuery = query.trim().toLocaleLowerCase(language);
  const filteredItems = items.filter((item) => {
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    const localized = localize(item, language);
    const searchable = [localized.text, localized.details ?? '', ...item.tags.map((id) => localizedTags.get(id) ?? id)].join(' ').toLocaleLowerCase(language);
    return searchable.includes(normalizedQuery);
  });
  const filteredTags = tags.filter((tag) => localize(tag, language).text.toLocaleLowerCase(language).includes(normalizedQuery));
  const sortedItems = [...filteredItems].sort((a, b) => {
    const left = sortKey === 'category' ? categoryName(a.category, t) : sortKey === 'tags' ? a.tags.map((id) => localizedTags.get(id) ?? id).join(', ') : sortKey === 'modified' ? a.modification_date : localize(a, language).text;
    const right = sortKey === 'category' ? categoryName(b.category, t) : sortKey === 'tags' ? b.tags.map((id) => localizedTags.get(id) ?? id).join(', ') : sortKey === 'modified' ? b.modification_date : localize(b, language).text;
    return collator.compare(left, right) * (sortDirection === 'asc' ? 1 : -1);
  });
  const sortedTags = [...filteredTags].sort((a, b) => {
    const comparison = sortKey === 'modified' ? collator.compare(a.modification_date, b.modification_date) : collator.compare(localize(a, language).text, localize(b, language).text);
    return comparison * (sortDirection === 'asc' ? 1 : -1);
  });
  const filtered = tab === 'techniques' ? sortedItems : sortedTags;
  const effectivePageSize = pageSize === 'all' ? Math.max(filtered.length, 1) : pageSize;
  const pageCount = Math.max(1, Math.ceil(filtered.length / effectivePageSize));
  const visible = filtered.slice(page * effectivePageSize, (page + 1) * effectivePageSize);

  function changeTab(next: 'techniques' | 'tags') {
    setTab(next);
    setPage(0);
    setQuery('');
    setSortKey('name');
  }

  function changeSort(next: SortKey) {
    if (sortKey === next) setSortDirection((direction) => direction === 'asc' ? 'desc' : 'asc');
    else {
      setSortKey(next);
      setSortDirection('asc');
    }
    setPage(0);
  }

  function sortLabel(key: SortKey, label: string) {
    return <button aria-label={`${label}${sortKey === key ? (sortDirection === 'asc' ? ', ascending' : ', descending') : ''}`} className="text-left hover:text-white" onClick={() => changeSort(key)} type="button">{label}{sortKey === key ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}</button>;
  }

  function saveTechnique(item: Technique) {
    onSaveItem({ ...item, modification_date: new Date().toISOString() });
    setEditingItem(null);
  }

  function saveTag(tag: Tag) {
    onSaveTag({ ...tag, modification_date: new Date().toISOString() });
    setEditingTag(null);
  }

  return (
    <>
      <PageHeader activeRoute={activeRoute} onLock={onLock} onNavigate={onNavigate} title={t('tech.title')} />
      <main className="mx-auto max-w-5xl space-y-5 px-3 py-5 sm:px-6 sm:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-lg border border-slate-700 bg-panel p-1" role="tablist">
            <button aria-selected={tab === 'techniques'} className={`rounded-md px-4 py-2 text-sm font-medium ${tab === 'techniques' ? 'bg-primary text-white' : 'text-slate-300'}`} onClick={() => changeTab('techniques')} role="tab" type="button">{t('tech.tabTechniques')}</button>
            <button aria-selected={tab === 'tags'} className={`rounded-md px-4 py-2 text-sm font-medium ${tab === 'tags' ? 'bg-primary text-white' : 'text-slate-300'}`} onClick={() => changeTab('tags')} role="tab" type="button">{t('tech.tabTags')}</button>
          </div>
          <div className="flex gap-2">
            {tab === 'techniques' && <IconButton icon="plus" label={t('tech.new')} onClick={() => setEditingItem(newTechnique())} />}
            {tab === 'tags' && <IconButton icon="plus" label={t('tech.newTag')} onClick={() => setEditingTag({ id: crypto.randomUUID(), title: '', text: '', modification_date: new Date().toISOString() })} />}
            <IconButton disabled icon="upload" label={t('tech.upload')} />
            <IconButton disabled icon="download" label={t('tech.download')} />
          </div>
        </div>
        <div className={`grid gap-3 ${tab === 'techniques' ? 'sm:grid-cols-[minmax(0,1fr)_14rem]' : ''}`}>
          <label className="block text-sm font-medium text-slate-300">
            {t('tech.search')}
            <input className="mt-1 min-h-11 w-full rounded-md border border-slate-600 bg-field px-3 text-white outline-none focus:border-primary" onChange={(event) => { setQuery(event.target.value); setPage(0); }} value={query} />
          </label>
          {tab === 'techniques' && (
            <label className="block text-sm font-medium text-slate-300">
              {t('tech.filterCategory')}
              <select className="mt-1 min-h-11 w-full rounded-md border border-slate-600 bg-field px-3 text-white outline-none focus:border-primary" onChange={(event) => { setCategoryFilter(event.target.value); setPage(0); }} value={categoryFilter}>
                <option value="all">{t('tech.allCategories')}</option>
                {categories.map((category) => <option key={category} value={category}>{categoryName(category, t)}</option>)}
              </select>
            </label>
          )}
        </div>
        {tab === 'techniques' ? (
          <div className="overflow-hidden rounded-xl border border-slate-700 bg-panel">
            <div className="grid grid-cols-3 gap-3 border-b border-slate-700 px-4 py-3 text-xs font-semibold uppercase text-slate-400 sm:hidden">
              <span>{sortLabel('name', t('tech.name'))}</span><span>{sortLabel('category', t('tech.category'))}</span><span>{sortLabel('tags', t('tech.tags'))}</span>
            </div>
            <div className="hidden grid-cols-[minmax(0,1fr)_8rem_minmax(0,1fr)_2.75rem] gap-3 border-b border-slate-700 px-4 py-3 text-xs font-semibold uppercase text-slate-400 sm:grid">
              <span>{sortLabel('name', t('tech.name'))}</span><span>{sortLabel('category', t('tech.category'))}</span><span>{sortLabel('tags', t('tech.tags'))}</span><span />
            </div>
            {visible.length === 0 && <p className="p-5 text-slate-400">{t('tech.noResults')}</p>}
            {visible.map((value) => {
              const item = value as Technique;
              return (
                <div className="grid grid-cols-[minmax(0,1fr)_2.75rem] items-center gap-3 border-b border-slate-700/70 px-4 py-3 last:border-0 sm:grid-cols-[minmax(0,1fr)_8rem_minmax(0,1fr)_2.75rem]" key={item.id}>
                  <span className="min-w-0 truncate font-medium text-white">{localize(item, language).text || item.text || '—'}</span>
                  <span className="hidden text-sm text-slate-400 sm:block">{categoryName(item.category, t)}</span>
                  <span className="hidden min-w-0 flex-wrap gap-1 sm:flex">
                    {item.tags.map((id) => <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300" key={id}>{localizedTags.get(id) ?? id}</span>)}
                  </span>
                  <IconButton icon="edit" label={t('tech.edit')} onClick={() => setEditingItem(item)} />
                  <span className="col-span-2 text-xs text-slate-400 sm:hidden">{categoryName(item.category, t)}{item.tags.length ? ` · ${item.tags.map((id) => localizedTags.get(id) ?? id).join(', ')}` : ''}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-700 bg-panel">
            <div className="grid grid-cols-[minmax(0,1fr)_auto_2.75rem] items-center gap-3 border-b border-slate-700 px-4 py-3 text-xs font-semibold uppercase text-slate-400">
              <span>{sortLabel('name', t('tech.name'))}</span><span>{sortLabel('modified', t('tech.modified'))}</span><span />
            </div>
            {visible.length === 0 && <p className="rounded-xl border border-slate-700 bg-panel p-5 text-slate-400">{t('tech.noResults')}</p>}
            {visible.map((value) => {
              const tag = value as Tag;
              return (
                <div className="grid min-h-12 grid-cols-[minmax(0,1fr)_auto_2.75rem] items-center gap-3 border-b border-slate-700/70 px-4 last:border-0" key={tag.id}>
                  <button className="min-w-0 flex-1 truncate py-3 text-left font-medium text-white" onClick={() => setEditingTag(tag)} type="button">{localize(tag, language).text || tag.text || '—'}</button>
                  <span className="text-xs tabular-nums text-slate-400">{tag.modification_date.slice(0, 10)}</span>
                  <IconButton icon="edit" label={t('tech.edit')} onClick={() => setEditingTag(tag)} />
                </div>
              );
            })}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-700 pt-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{t('tech.pageSize')}</span>
            <div aria-label={t('tech.pageSize')} className="inline-flex rounded-lg border border-slate-700 bg-panel p-1" role="group">
              {([10, 20, 'all'] as const).map((size) => (
                <button aria-pressed={pageSize === size} className={`min-h-8 min-w-9 rounded-md px-2 text-sm font-medium transition-colors ${pageSize === size ? 'bg-primary text-white' : 'text-slate-300 hover:bg-slate-700'}`} key={size} onClick={() => { setPageSize(size); setPage(0); }} type="button">{size === 'all' ? t('tech.all') : size}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span aria-live="polite" className="whitespace-nowrap text-sm tabular-nums text-slate-300">{t('tech.range', { from: filtered.length === 0 ? 0 : page * effectivePageSize + 1, to: Math.min((page + 1) * effectivePageSize, filtered.length), total: filtered.length })}</span>
            <IconButton disabled={page === 0} icon="left" label={t('tech.previous')} onClick={() => setPage((current) => Math.max(0, current - 1))} />
            <IconButton disabled={page + 1 >= pageCount} icon="right" label={t('tech.next')} onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} />
          </div>
        </div>
      </main>
      {editingItem && <TechniqueEditor item={editingItem} tags={tags} onClose={() => setEditingItem(null)} onSave={saveTechnique} />}
      {editingTag && <TagEditor tag={editingTag} onClose={() => setEditingTag(null)} onSave={saveTag} />}
    </>
  );
}

function LanguageTabs({ selected, onSelect }: { selected: Language; onSelect: (language: Language) => void }) {
  const { t } = useI18n();
  return (
    <div aria-label={t('language.select')} className="mb-4 flex gap-2 overflow-x-auto border-b border-slate-700 pb-2" role="tablist">
      {languages.map((language) => <button aria-selected={selected === language} className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm ${selected === language ? 'bg-primary/15 text-primary' : 'text-slate-300 hover:bg-slate-700'}`} key={language} onClick={() => onSelect(language)} role="tab" type="button"><FlagIcon language={language} /><span className="uppercase">{language}</span></button>)}
    </div>
  );
}

function TechniqueEditor({ item, tags, onClose, onSave }: { item: Technique; tags: Tag[]; onClose: () => void; onSave: (item: Technique) => void }) {
  const { language, t } = useI18n();
  const [draft, setDraft] = useState(item);
  const [editLanguage, setEditLanguage] = useState<Language>(language);
  const current = localizedText(draft, editLanguage);
  const translatedTags = tags.map((tag) => ({ tag, title: localize(tag, language).text }));

  function changeLocalized(values: { title: string; teaser: string; details: string }) {
    if (editLanguage === 'de') {
      setDraft((currentDraft) => ({ ...currentDraft, title: values.title, text: values.title, teaser: values.teaser, details: values.details || undefined }));
      return;
    }
    const translationLanguage = editLanguage as TranslationLanguage;
    setDraft((currentDraft) => ({
      ...currentDraft,
      translations: {
        ...currentDraft.translations,
        [translationLanguage]: { ...currentDraft.translations?.[translationLanguage], title: values.title, text: values.title, teaser: values.teaser || undefined, details: values.details || undefined },
      },
    }));
  }

  function toggleTag(id: string) {
    setDraft((currentDraft) => ({ ...currentDraft, tags: currentDraft.tags.includes(id) ? currentDraft.tags.filter((tagId) => tagId !== id) : [...currentDraft.tags, id] }));
  }

  return (
    <Modal onClose={onClose} size="large" title={t('tech.edit')}>
      <LanguageTabs onSelect={setEditLanguage} selected={editLanguage} />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-300">{t('tech.name')}<input className="mt-1 min-h-11 w-full rounded-md border border-slate-600 bg-field px-3 text-white outline-none focus:border-primary" onChange={(event) => changeLocalized({ ...current, title: event.target.value })} value={current.title} /></label>
          <label className="block text-sm font-medium text-slate-300">{t('tech.teaser')}<textarea className="mt-1 min-h-20 w-full resize-y rounded-md border border-slate-600 bg-field px-3 py-2 text-white outline-none focus:border-primary" maxLength={200} onChange={(event) => changeLocalized({ ...current, teaser: event.target.value })} value={current.teaser} /><span className="text-xs text-slate-500">{t('tech.characters', { count: current.teaser.length })}</span></label>
          <div className="text-sm font-medium text-slate-300">{t('tech.details')}<div className="mt-1"><RichTextEditor onChange={(details) => changeLocalized({ ...current, details })} value={current.details} /></div></div>
        </div>
        <div className="space-y-5">
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-slate-300">{t('tech.category')}</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {categories.map((category) => (
                <button aria-pressed={draft.category === category} className={`min-h-10 rounded-md border px-2 text-sm ${draft.category === category ? 'border-primary bg-primary/15 text-primary' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}`} key={category} onClick={() => setDraft((currentDraft) => ({ ...currentDraft, category, level: category.startsWith('level-') ? Number(category.slice(-1)) as Technique['level'] : undefined }))} type="button">{categoryName(category, t)}</button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-slate-300">{t('tech.tags')}</legend>
            <div className="flex max-h-52 flex-wrap gap-2 overflow-y-auto">
              {translatedTags.map(({ tag, title }) => {
                const active = draft.tags.includes(tag.id);
                return <button aria-pressed={active} className={`rounded-full border px-3 py-1.5 text-sm ${active ? 'border-primary bg-primary/15 text-primary' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}`} key={tag.id} onClick={() => toggleTag(tag.id)} type="button">{title}</button>;
              })}
              {tags.length === 0 && <span className="text-sm text-slate-400">{t('tech.noTags')}</span>}
            </div>
          </fieldset>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2 border-t border-slate-700 pt-4">
        <button className="rounded-md border border-slate-600 px-4 py-2 text-sm text-slate-200" onClick={onClose} type="button">{t('exam.cancel')}</button>
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-40" disabled={!draft.title.trim()} onClick={() => onSave(draft)} type="button">{t('tech.save')}</button>
      </div>
    </Modal>
  );
}

function TagEditor({ tag, onClose, onSave }: { tag: Tag; onClose: () => void; onSave: (tag: Tag) => void }) {
  const { language, t } = useI18n();
  const [draft, setDraft] = useState(tag);
  const [editLanguage, setEditLanguage] = useState<Language>(language);
  const text = editLanguage === 'de' ? draft.title || draft.text : draft.translations?.[editLanguage as TranslationLanguage]?.title ?? draft.translations?.[editLanguage as TranslationLanguage]?.text ?? '';

  function changeText(value: string) {
    if (editLanguage === 'de') setDraft((current) => ({ ...current, title: value, text: value }));
    else {
      const key = editLanguage as TranslationLanguage;
      setDraft((current) => ({ ...current, translations: { ...current.translations, [key]: { ...current.translations?.[key], title: value, text: value } } }));
    }
  }

  return (
    <Modal onClose={onClose} size="large" title={t('tech.edit')}>
      <LanguageTabs onSelect={setEditLanguage} selected={editLanguage} />
      <label className="block text-sm font-medium text-slate-300">{t('tech.name')}<input autoFocus className="mt-1 min-h-11 w-full rounded-md border border-slate-600 bg-field px-3 text-white outline-none focus:border-primary" onChange={(event) => changeText(event.target.value)} value={text} /></label>
      <div className="mt-5 flex justify-end gap-2 border-t border-slate-700 pt-4">
        <button className="rounded-md border border-slate-600 px-4 py-2 text-sm text-slate-200" onClick={onClose} type="button">{t('exam.cancel')}</button>
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-40" disabled={!draft.title.trim()} onClick={() => onSave(draft)} type="button">{t('tech.save')}</button>
      </div>
    </Modal>
  );
}